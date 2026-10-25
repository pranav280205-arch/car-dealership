"""Tests for GET /api/vehicles/search."""
import pytest


@pytest.fixture
def lot(make_vehicle):
    """A small, varied lot to search through."""
    make_vehicle(make="Toyota", model="Corolla", category="Sedan", price=1850000, quantity=4)
    make_vehicle(make="Toyota", model="Fortuner", category="SUV", price=3600000, quantity=2)
    make_vehicle(make="Honda", model="City", category="Sedan", price=1300000, quantity=0)
    make_vehicle(make="Tata", model="Nexon", category="SUV", price=1100000, quantity=7)
    make_vehicle(make="Maruti", model="Swift", category="Hatchback", price=700000, quantity=9)


def search(client, headers, **params):
    res = client.get("/api/vehicles/search", params=params, headers=headers)
    assert res.status_code == 200, res.text
    return sorted(v["model"] for v in res.json())


def test_search_requires_login(client):
    assert client.get("/api/vehicles/search").status_code == 401


def test_search_with_no_filters_returns_everything(client, user_headers, lot):
    assert len(search(client, user_headers)) == 5


def test_search_by_make_is_case_insensitive(client, user_headers, lot):
    assert search(client, user_headers, make="toyota") == ["Corolla", "Fortuner"]


def test_search_by_partial_model(client, user_headers, lot):
    assert search(client, user_headers, model="for") == ["Fortuner"]


def test_search_by_category(client, user_headers, lot):
    assert search(client, user_headers, category="suv") == ["Fortuner", "Nexon"]


def test_search_by_price_range(client, user_headers, lot):
    result = search(client, user_headers, min_price=1000000, max_price=2000000)
    assert result == ["City", "Corolla", "Nexon"]


def test_search_with_only_max_price(client, user_headers, lot):
    assert search(client, user_headers, max_price=800000) == ["Swift"]


def test_search_combines_filters(client, user_headers, lot):
    assert search(client, user_headers, category="Sedan", max_price=1500000) == ["City"]


def test_search_free_text_matches_make_or_model(client, user_headers, lot):
    assert search(client, user_headers, q="tata") == ["Nexon"]  # matches make
    assert search(client, user_headers, q="swi") == ["Swift"]  # matches model
    # "ta" is in both "Tata" and "Toyota", so it should catch all three
    assert search(client, user_headers, q="ta") == ["Corolla", "Fortuner", "Nexon"]


def test_search_can_hide_out_of_stock(client, user_headers, lot):
    result = search(client, user_headers, category="Sedan", in_stock=True)
    assert result == ["Corolla"]


def test_search_with_no_match_returns_empty_list(client, user_headers, lot):
    assert search(client, user_headers, make="Ferrari") == []


def test_search_rejects_min_price_above_max_price(client, user_headers, lot):
    res = client.get(
        "/api/vehicles/search",
        params={"min_price": 500, "max_price": 100},
        headers=user_headers,
    )
    assert res.status_code == 400


def test_search_rejects_negative_price(client, user_headers):
    res = client.get(
        "/api/vehicles/search", params={"min_price": -5}, headers=user_headers
    )
    assert res.status_code == 422
