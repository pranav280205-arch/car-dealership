"""Tests for the admin dashboard numbers: GET /api/stats."""


def test_stats_is_admin_only(client, user_headers):
    assert client.get("/api/stats", headers=user_headers).status_code == 403


def test_stats_on_empty_inventory(client, admin_headers):
    res = client.get("/api/stats", headers=admin_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["total_models"] == 0
    assert body["units_in_stock"] == 0
    assert body["stock_value"] == 0
    assert body["units_sold"] == 0
    assert body["revenue"] == 0
    assert body["low_stock"] == []
    assert body["by_category"] == []


def test_stats_adds_up_stock_and_sales(client, admin_headers, user_headers, make_vehicle):
    a = make_vehicle(model="Corolla", category="Sedan", price=100, quantity=5)
    make_vehicle(model="Fortuner", category="SUV", price=300, quantity=1)
    make_vehicle(model="Nexon", category="SUV", price=200, quantity=0)
    client.post(f"/api/vehicles/{a['id']}/purchase", json={"quantity": 2}, headers=user_headers)

    body = client.get("/api/stats", headers=admin_headers).json()

    assert body["total_models"] == 3
    assert body["units_in_stock"] == 3 + 1 + 0
    assert body["stock_value"] == 3 * 100 + 1 * 300
    assert body["units_sold"] == 2
    assert body["revenue"] == 200
    # low stock = 2 or fewer left, most urgent first
    assert [v["model"] for v in body["low_stock"]] == ["Nexon", "Fortuner"]
    assert body["by_category"] == [
        {"category": "SUV", "models": 2, "units": 1},
        {"category": "Sedan", "models": 1, "units": 3},
    ]
