"""Tests for vehicle CRUD: POST/GET/PUT/DELETE /api/vehicles."""
from tests.conftest import SAMPLE_VEHICLE


# ---------- protection ----------

def test_listing_vehicles_requires_login(client):
    assert client.get("/api/vehicles").status_code == 401


def test_adding_vehicle_requires_login(client):
    assert client.post("/api/vehicles", json=SAMPLE_VEHICLE).status_code == 401


def test_normal_user_cannot_add_vehicle(client, user_headers):
    res = client.post("/api/vehicles", json=SAMPLE_VEHICLE, headers=user_headers)
    assert res.status_code == 403


# ---------- create ----------

def test_admin_can_add_vehicle(client, admin_headers):
    res = client.post("/api/vehicles", json=SAMPLE_VEHICLE, headers=admin_headers)

    assert res.status_code == 201
    body = res.json()
    assert isinstance(body["id"], int)
    assert body["make"] == "Toyota"
    assert body["model"] == "Corolla"
    assert body["category"] == "Sedan"
    assert body["price"] == 1850000
    assert body["quantity"] == 5


def test_add_vehicle_rejects_negative_price(client, admin_headers):
    res = client.post(
        "/api/vehicles", json={**SAMPLE_VEHICLE, "price": -1}, headers=admin_headers
    )
    assert res.status_code == 422


def test_add_vehicle_rejects_negative_quantity(client, admin_headers):
    res = client.post(
        "/api/vehicles", json={**SAMPLE_VEHICLE, "quantity": -3}, headers=admin_headers
    )
    assert res.status_code == 422


def test_add_vehicle_requires_make(client, admin_headers):
    data = {k: v for k, v in SAMPLE_VEHICLE.items() if k != "make"}
    res = client.post("/api/vehicles", json=data, headers=admin_headers)
    assert res.status_code == 422


# ---------- read ----------

def test_list_returns_all_vehicles(client, user_headers, make_vehicle):
    make_vehicle(model="Corolla")
    make_vehicle(model="Camry")

    res = client.get("/api/vehicles", headers=user_headers)

    assert res.status_code == 200
    models = [v["model"] for v in res.json()]
    assert sorted(models) == ["Camry", "Corolla"]


def test_list_includes_out_of_stock_so_ui_can_show_them(client, user_headers, make_vehicle):
    make_vehicle(quantity=0)
    res = client.get("/api/vehicles", headers=user_headers)
    assert res.json()[0]["quantity"] == 0


def test_get_single_vehicle(client, user_headers, make_vehicle):
    car = make_vehicle()
    res = client.get(f"/api/vehicles/{car['id']}", headers=user_headers)
    assert res.status_code == 200
    assert res.json()["id"] == car["id"]


def test_get_missing_vehicle_returns_404(client, user_headers):
    assert client.get("/api/vehicles/999", headers=user_headers).status_code == 404


# ---------- update ----------

def test_admin_can_update_vehicle(client, admin_headers, make_vehicle):
    car = make_vehicle()
    res = client.put(
        f"/api/vehicles/{car['id']}",
        json={"price": 1799000, "category": "Hatchback"},
        headers=admin_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert body["price"] == 1799000
    assert body["category"] == "Hatchback"
    assert body["make"] == "Toyota"  # untouched fields stay the same


def test_update_rejects_negative_price(client, admin_headers, make_vehicle):
    car = make_vehicle()
    res = client.put(
        f"/api/vehicles/{car['id']}", json={"price": -10}, headers=admin_headers
    )
    assert res.status_code == 422


def test_normal_user_cannot_update_vehicle(client, user_headers, make_vehicle):
    car = make_vehicle()
    res = client.put(
        f"/api/vehicles/{car['id']}", json={"price": 1}, headers=user_headers
    )
    assert res.status_code == 403


def test_update_missing_vehicle_returns_404(client, admin_headers):
    res = client.put("/api/vehicles/999", json={"price": 1}, headers=admin_headers)
    assert res.status_code == 404


# ---------- delete ----------

def test_admin_can_delete_vehicle(client, admin_headers, make_vehicle):
    car = make_vehicle()

    res = client.delete(f"/api/vehicles/{car['id']}", headers=admin_headers)

    assert res.status_code == 204
    assert client.get(f"/api/vehicles/{car['id']}", headers=admin_headers).status_code == 404


def test_normal_user_cannot_delete_vehicle(client, user_headers, make_vehicle):
    car = make_vehicle()
    res = client.delete(f"/api/vehicles/{car['id']}", headers=user_headers)
    assert res.status_code == 403


def test_delete_missing_vehicle_returns_404(client, admin_headers):
    assert client.delete("/api/vehicles/999", headers=admin_headers).status_code == 404
