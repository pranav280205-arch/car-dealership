# Test report

Generated on 25 Oct 2026 by running the commands below on a clean checkout.

| Suite | Tests | Result | Line coverage |
|---|---|---|---|
| Backend (pytest) | 70 | all passing | 99% |
| Frontend (Vitest + Testing Library) | 37 | all passing | 83% |

The only uncovered backend lines are `get_db()` in `database.py`, which the
tests replace with a per-test database on purpose.

## Backend

```
cd backend
pytest -v --cov=app
```

```
============================= test session starts ==============================
collecting ... collected 70 items

tests/test_auth.py::test_register_creates_user_and_hides_password PASSED
tests/test_auth.py::test_register_rejects_duplicate_email PASSED
tests/test_auth.py::test_register_email_is_case_insensitive PASSED
tests/test_auth.py::test_register_rejects_invalid_email PASSED
tests/test_auth.py::test_register_rejects_short_password PASSED
tests/test_auth.py::test_register_cannot_make_yourself_admin PASSED
tests/test_auth.py::test_login_returns_bearer_token PASSED
tests/test_auth.py::test_login_with_wrong_password_fails PASSED
tests/test_auth.py::test_login_with_unknown_email_fails PASSED
tests/test_auth.py::test_me_returns_current_user_when_token_is_valid PASSED
tests/test_auth.py::test_me_without_token_is_unauthorized PASSED
tests/test_auth.py::test_me_with_garbage_token_is_unauthorized PASSED
tests/test_health.py::test_health_check_returns_ok PASSED
tests/test_inventory.py::test_purchase_requires_login PASSED
tests/test_inventory.py::test_purchase_decreases_quantity_by_one_by_default PASSED
tests/test_inventory.py::test_purchase_several_units_at_once PASSED
tests/test_inventory.py::test_purchase_records_an_order_with_price_at_time_of_sale PASSED
tests/test_inventory.py::test_cannot_purchase_when_out_of_stock PASSED
tests/test_inventory.py::test_cannot_purchase_more_than_available PASSED
tests/test_inventory.py::test_purchase_quantity_must_be_positive PASSED
tests/test_inventory.py::test_purchase_missing_vehicle_returns_404 PASSED
tests/test_inventory.py::test_parallel_purchases_never_oversell PASSED
tests/test_inventory.py::test_admin_can_restock PASSED
tests/test_inventory.py::test_restock_brings_sold_out_vehicle_back PASSED
tests/test_inventory.py::test_normal_user_cannot_restock PASSED
tests/test_inventory.py::test_restock_quantity_must_be_positive PASSED
tests/test_inventory.py::test_restock_missing_vehicle_returns_404 PASSED
tests/test_inventory.py::test_users_only_see_their_own_orders PASSED
tests/test_inventory.py::test_admin_can_see_all_orders PASSED
tests/test_inventory.py::test_normal_user_cannot_see_all_orders PASSED
tests/test_inventory.py::test_order_history_survives_vehicle_deletion PASSED
tests/test_search.py::test_search_requires_login PASSED
tests/test_search.py::test_search_with_no_filters_returns_everything PASSED
tests/test_search.py::test_search_by_make_is_case_insensitive PASSED
tests/test_search.py::test_search_by_partial_model PASSED
tests/test_search.py::test_search_by_category PASSED
tests/test_search.py::test_search_by_price_range PASSED
tests/test_search.py::test_search_with_only_max_price PASSED
tests/test_search.py::test_search_combines_filters PASSED
tests/test_search.py::test_search_free_text_matches_make_or_model PASSED
tests/test_search.py::test_search_can_hide_out_of_stock PASSED
tests/test_search.py::test_search_with_no_match_returns_empty_list PASSED
tests/test_search.py::test_search_rejects_min_price_above_max_price PASSED
tests/test_search.py::test_search_rejects_negative_price PASSED
tests/test_security.py::test_password_hash_is_not_the_password PASSED
tests/test_security.py::test_token_round_trip_keeps_user_id_and_role PASSED
tests/test_security.py::test_expired_token_is_rejected PASSED
tests/test_security.py::test_token_signed_with_another_secret_is_rejected PASSED
tests/test_security.py::test_valid_token_for_a_user_that_no_longer_exists_is_rejected PASSED
tests/test_stats.py::test_stats_is_admin_only PASSED
tests/test_stats.py::test_stats_on_empty_inventory PASSED
tests/test_stats.py::test_stats_adds_up_stock_and_sales PASSED
tests/test_vehicles.py::test_listing_vehicles_requires_login PASSED
tests/test_vehicles.py::test_adding_vehicle_requires_login PASSED
tests/test_vehicles.py::test_normal_user_cannot_add_vehicle PASSED
tests/test_vehicles.py::test_admin_can_add_vehicle PASSED
tests/test_vehicles.py::test_add_vehicle_rejects_negative_price PASSED
tests/test_vehicles.py::test_add_vehicle_rejects_negative_quantity PASSED
tests/test_vehicles.py::test_add_vehicle_requires_make PASSED
tests/test_vehicles.py::test_list_returns_all_vehicles PASSED
tests/test_vehicles.py::test_list_includes_out_of_stock_so_ui_can_show_them PASSED
tests/test_vehicles.py::test_get_single_vehicle PASSED
tests/test_vehicles.py::test_get_missing_vehicle_returns_404 PASSED
tests/test_vehicles.py::test_admin_can_update_vehicle PASSED
tests/test_vehicles.py::test_update_rejects_negative_price PASSED
tests/test_vehicles.py::test_normal_user_cannot_update_vehicle PASSED
tests/test_vehicles.py::test_update_missing_vehicle_returns_404 PASSED
tests/test_vehicles.py::test_admin_can_delete_vehicle PASSED
tests/test_vehicles.py::test_normal_user_cannot_delete_vehicle PASSED
tests/test_vehicles.py::test_delete_missing_vehicle_returns_404 PASSED

================================ tests coverage ================================
_______________ coverage: platform linux, python 3.13.17-final-0 _______________

Name                                Stmts   Miss  Cover
-------------------------------------------------------
app/__init__.py                         0      0   100%
app/config.py                           9      0   100%
app/database.py                        15      4    73%
app/deps.py                            22      0   100%
app/main.py                            23      0   100%
app/models.py                          44      0   100%
app/routers/__init__.py                 0      0   100%
app/routers/auth.py                    18      0   100%
app/routers/inventory.py               22      0   100%
app/routers/stats.py                   10      0   100%
app/routers/vehicles.py                27      0   100%
app/schemas.py                         74      0   100%
app/security.py                        18      0   100%
app/services/__init__.py                0      0   100%
app/services/auth_service.py           23      0   100%
app/services/errors.py                 11      0   100%
app/services/inventory_service.py      35      0   100%
app/services/stats_service.py          13      0   100%
app/services/vehicle_service.py        63      0   100%
-------------------------------------------------------
TOTAL                                 427      4    99%
============================== 70 passed in 5.02s ==============================
```

## Frontend

```
cd frontend
npx vitest run --coverage --reporter=verbose
```

```
Coverage enabled with v8
 ✓ src/pages/AuthPages.test.jsx > LoginPage > logs in, stores the token and goes to the inventory 585ms
 ✓ src/pages/AuthPages.test.jsx > LoginPage > shows the server error when login fails 232ms
 ✓ src/pages/AuthPages.test.jsx > RegisterPage > stops the user when the two passwords differ, without calling the API 407ms
 ✓ src/pages/AuthPages.test.jsx > RegisterPage > registers and then logs the new user straight in 402ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > lists every car on the lot 95ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > sends the chosen filters to the search endpoint 580ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > reads filters from the URL so a filtered view can be shared 35ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > shows a helpful empty state when nothing matches 52ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > buys a car, updates its stock and confirms with a toast 71ms
 ✓ src/pages/InventoryPage.test.jsx > InventoryPage > keeps the sold-out car visible but not purchasable 37ms
 ✓ src/components/VehicleForm.test.jsx > VehicleForm > submits numbers as numbers, not strings 533ms
 ✓ src/components/VehicleForm.test.jsx > VehicleForm > blocks submit and explains when required fields are missing 42ms
 ✓ src/components/VehicleForm.test.jsx > VehicleForm > rejects a negative price 284ms
 ✓ src/components/VehicleForm.test.jsx > VehicleForm > prefills when editing and labels the button accordingly 34ms
 ✓ src/components/VehicleForm.test.jsx > VehicleForm > shows a server error passed back from onSubmit 296ms
 ✓ src/pages/AdminPage.test.jsx > AdminPage > shows the headline numbers 169ms
 ✓ src/pages/AdminPage.test.jsx > AdminPage > lists low-stock cars so they can be reordered 287ms
 ✓ src/pages/AdminPage.test.jsx > AdminPage > adds a vehicle through the form and shows it in the table 523ms
 ✓ src/pages/AdminPage.test.jsx > AdminPage > restocks a car 124ms
 ✓ src/pages/AdminPage.test.jsx > AdminPage > asks before deleting and removes the row after confirming 85ms
 ✓ src/components/VehicleCard.test.jsx > VehicleCard > shows the car name, category and price 37ms
 ✓ src/components/VehicleCard.test.jsx > VehicleCard > calls onPurchase with the vehicle when Buy is clicked 144ms
 ✓ src/components/VehicleCard.test.jsx > VehicleCard > disables the purchase button when the car is sold out 13ms
 ✓ src/components/VehicleCard.test.jsx > VehicleCard > disables the button while a purchase is in progress 14ms
 ✓ src/components/VehicleCard.test.jsx > VehicleCard > warns when stock is low 6ms
 ✓ src/components/ProtectedRoute.test.jsx > ProtectedRoute > sends logged-out visitors to the login page 77ms
 ✓ src/components/ProtectedRoute.test.jsx > ProtectedRoute > lets a logged-in user through 4ms
 ✓ src/components/ProtectedRoute.test.jsx > ProtectedRoute > sends a normal user away from admin-only pages 3ms
 ✓ src/components/ProtectedRoute.test.jsx > ProtectedRoute > lets an admin into admin-only pages 3ms
 ✓ src/utils/format.test.js > formatPrice > formats rupees with Indian digit grouping and no decimals 4ms
 ✓ src/utils/format.test.js > formatPrice > handles zero 1ms
 ✓ src/utils/format.test.js > stockLabel > says sold out at zero 0ms
 ✓ src/utils/format.test.js > stockLabel > warns when only one or two are left 0ms
 ✓ src/utils/format.test.js > stockLabel > shows the count otherwise 0ms
 ✓ src/utils/format.test.js > toSearchParams > drops empty filters so the URL stays clean 0ms
 ✓ src/utils/format.test.js > toSearchParams > maps camelCase filters to the API names 1ms
 ✓ src/utils/format.test.js > toSearchParams > leaves in_stock out when it is off 0ms
 Test Files  7 passed (7)
      Tests  37 passed (37)
   Start at  15:28:48
   Duration  15.67s (environment 42%, tests 38%, setup 9%, transform 5%, import 4%, worker 2%)
Environment  jsdom was created 7 times · 5.66s total, 42% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   83.06 |    76.92 |      78 |   83.08 |                   
 src               |       0 |        0 |       0 |       0 |                   
  App.jsx          |       0 |        0 |       0 |       0 | 14-31             
 src/api           |   77.27 |       72 |      80 |   76.92 |                   
  client.js        |   77.27 |       72 |      80 |   76.92 | 19,25-30,43,61,69 
 src/components    |   88.04 |    81.81 |   82.35 |    88.6 |                   
  FilterBar.jsx    |   77.77 |       75 |   66.66 |      75 | 15,49             
  Modal.jsx        |     100 |       50 |     100 |     100 | 11                
  Navbar.jsx       |       0 |        0 |       0 |       0 | 5-19              
  Toast.jsx        |    87.5 |       80 |   66.66 |     100 | 23                
  VehicleCard.jsx  |     100 |    94.11 |     100 |     100 | 38                
  VehicleForm.jsx  |   96.77 |    87.09 |     100 |     100 | 11-13,23,32       
 src/context       |   78.78 |       70 |   77.77 |   83.33 |                   
  AuthContext.jsx  |   78.78 |       70 |   77.77 |   83.33 | 12,20-22,45       
 src/hooks         |     100 |      100 |   83.33 |     100 |                   
  useToast.js      |     100 |      100 |      50 |     100 |                   
 src/pages         |   82.12 |    73.68 |   77.33 |   81.64 |                   
  AdminPage.jsx    |   80.95 |    70.58 |   78.04 |   79.45 | ...47,252,272-277 
  ...ntoryPage.jsx |   93.33 |    89.18 |   85.71 |    92.3 | 56,70,104         
  OrdersPage.jsx   |       0 |        0 |       0 |       0 | 7-33              
  RegisterPage.jsx |    82.6 |     87.5 |     100 |   80.95 | 23-24,31-32       
-------------------|---------|----------|---------|---------|-------------------
=============================== Coverage summary ===============================
Statements   : 83.06% ( 314/378 )
Branches     : 76.92% ( 170/221 )
Functions    : 78% ( 117/150 )
Lines        : 83.08% ( 275/331 )
================================================================================
```
