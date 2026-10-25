"""Tests for purchase and restock: POST /api/vehicles/:id/purchase|restock."""
from concurrent.futures import ThreadPoolExecutor

from app.services.errors import DomainError
from app.services.inventory_service import InventoryService


def purchase(client, headers, vehicle_id, **body):
    return client.post(f"/api/vehicles/{vehicle_id}/purchase", json=body, headers=headers)


def restock(client, headers, vehicle_id, quantity):
    return client.post(
        f"/api/vehicles/{vehicle_id}/restock", json={"quantity": quantity}, headers=headers
    )


# ---------- purchase ----------

def test_purchase_requires_login(client, make_vehicle):
    car = make_vehicle()
    assert client.post(f"/api/vehicles/{car['id']}/purchase").status_code == 401


def test_purchase_decreases_quantity_by_one_by_default(client, user_headers, make_vehicle):
    car = make_vehicle(quantity=5)

    res = purchase(client, user_headers, car["id"])

    assert res.status_code == 200
    assert res.json()["vehicle"]["quantity"] == 4


def test_purchase_several_units_at_once(client, user_headers, make_vehicle):
    car = make_vehicle(quantity=5)
    res = purchase(client, user_headers, car["id"], quantity=3)
    assert res.json()["vehicle"]["quantity"] == 2


def test_purchase_records_an_order_with_price_at_time_of_sale(
    client, user_headers, admin_headers, make_vehicle
):
    car = make_vehicle(price=1000000, quantity=5)

    order = purchase(client, user_headers, car["id"], quantity=2).json()["order"]
    # price change later shouldn't rewrite history
    client.put(f"/api/vehicles/{car['id']}", json={"price": 5}, headers=admin_headers)

    assert order["quantity"] == 2
    assert order["unit_price"] == 1000000
    assert order["total"] == 2000000

    mine = client.get("/api/orders/me", headers=user_headers).json()
    assert len(mine) == 1
    assert mine[0]["unit_price"] == 1000000
    assert mine[0]["vehicle_name"] == "Toyota Corolla"


def test_cannot_purchase_when_out_of_stock(client, user_headers, make_vehicle):
    car = make_vehicle(quantity=0)

    res = purchase(client, user_headers, car["id"])

    assert res.status_code == 409
    assert "stock" in res.json()["detail"].lower()


def test_cannot_purchase_more_than_available(client, user_headers, make_vehicle):
    car = make_vehicle(quantity=2)

    res = purchase(client, user_headers, car["id"], quantity=3)

    assert res.status_code == 409
    after = client.get(f"/api/vehicles/{car['id']}", headers=user_headers).json()
    assert after["quantity"] == 2  # nothing was taken


def test_purchase_quantity_must_be_positive(client, user_headers, make_vehicle):
    car = make_vehicle()
    assert purchase(client, user_headers, car["id"], quantity=0).status_code == 422


def test_purchase_missing_vehicle_returns_404(client, user_headers):
    assert purchase(client, user_headers, 999).status_code == 404


def test_parallel_purchases_never_oversell(db_session_factory, client, make_vehicle):
    """10 buyers race for 3 cars. Exactly 3 should win and stock should end at 0,
    never negative. This is why purchase uses a single conditional UPDATE instead
    of read-then-write."""
    car = make_vehicle(quantity=3)
    with db_session_factory() as db:
        from app.services.auth_service import AuthService

        buyer = AuthService(db).register("Buyer", "buyer@example.com", "secret123")
        buyer_id = buyer.id

    def try_buy(_):
        with db_session_factory() as db:
            try:
                InventoryService(db).purchase(car["id"], buyer_id, 1)
                return True
            except DomainError:
                return False

    with ThreadPoolExecutor(max_workers=10) as pool:
        results = list(pool.map(try_buy, range(10)))

    assert results.count(True) == 3
    with db_session_factory() as db:
        assert InventoryService(db).vehicles.get(car["id"]).quantity == 0


# ---------- restock ----------

def test_admin_can_restock(client, admin_headers, make_vehicle):
    car = make_vehicle(quantity=1)

    res = restock(client, admin_headers, car["id"], 4)

    assert res.status_code == 200
    assert res.json()["quantity"] == 5


def test_restock_brings_sold_out_vehicle_back(client, admin_headers, user_headers, make_vehicle):
    car = make_vehicle(quantity=0)
    restock(client, admin_headers, car["id"], 2)
    assert purchase(client, user_headers, car["id"]).status_code == 200


def test_normal_user_cannot_restock(client, user_headers, make_vehicle):
    car = make_vehicle()
    assert restock(client, user_headers, car["id"], 5).status_code == 403


def test_restock_quantity_must_be_positive(client, admin_headers, make_vehicle):
    car = make_vehicle()
    assert restock(client, admin_headers, car["id"], 0).status_code == 422
    assert restock(client, admin_headers, car["id"], -2).status_code == 422


def test_restock_missing_vehicle_returns_404(client, admin_headers):
    assert restock(client, admin_headers, 999, 5).status_code == 404


# ---------- order history ----------

def test_users_only_see_their_own_orders(client, user_headers, admin_headers, make_vehicle):
    car = make_vehicle(quantity=5)
    purchase(client, admin_headers, car["id"])

    assert client.get("/api/orders/me", headers=user_headers).json() == []


def test_admin_can_see_all_orders(client, user_headers, admin_headers, make_vehicle):
    car = make_vehicle(quantity=5)
    purchase(client, user_headers, car["id"])
    purchase(client, admin_headers, car["id"])

    res = client.get("/api/orders", headers=admin_headers)

    assert res.status_code == 200
    assert len(res.json()) == 2
    assert {o["buyer_email"] for o in res.json()} == {"user@example.com", "admin@example.com"}


def test_normal_user_cannot_see_all_orders(client, user_headers):
    assert client.get("/api/orders", headers=user_headers).status_code == 403


def test_order_history_survives_vehicle_deletion(client, user_headers, admin_headers, make_vehicle):
    car = make_vehicle(quantity=5)
    purchase(client, user_headers, car["id"])

    client.delete(f"/api/vehicles/{car['id']}", headers=admin_headers)

    mine = client.get("/api/orders/me", headers=user_headers).json()
    assert len(mine) == 1
    assert mine[0]["vehicle_name"] == "Toyota Corolla"
