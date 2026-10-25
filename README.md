# Lot42: Car Dealership Inventory System

A full-stack inventory app for a car dealership. Customers browse the lot, search and filter cars, and buy them. Admins add, edit, restock and delete vehicles, and see stock value, sales and what's running low.

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (or PostgreSQL), JWT auth
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Tests:** pytest (70 tests, 99% coverage) and Vitest + Testing Library (37 tests). See [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

![Inventory page](docs/screenshots/02-inventory.png)

## Features

**Everything the kata asks for**

- Register and log in; JWT protects every vehicle and inventory endpoint
- List, search and filter vehicles by make, model, category and price range
- Purchase (decreases stock) and restock (admin only)
- Admin-only add, edit and delete
- The purchase button is disabled when a car is sold out

**Extras**

- **No overselling under load.** A purchase is a single conditional `UPDATE ... WHERE quantity >= n`, so two people can't both buy the last car. A test fires 10 parallel purchases at a car with 3 in stock and checks exactly 3 succeed.
- **Order history.** Every purchase is recorded with the price paid. Customers see "My purchases" and admins see recent sales. Orders keep the car's name and price even if the vehicle is later edited or deleted.
- **Admin dashboard.** Shows stock value, cars in stock, cars sold, revenue, a "running low" list with a restock shortcut, and stock by category.
- **Shareable searches.** Filters are written into the URL (for example `/?category=SUV&max_price=1600000`), so a filtered view can be bookmarked or sent to someone.
- **Free-text search and an "in stock only" toggle** on top of the required filters.
- **Seed script** with an admin account, a customer account and 16 Indian-market cars, so there's something to click on straight away.
- **Small UX details:** prices in Indian format (₹18,50,000), low-stock warnings, toasts after every action, a confirmation step before deleting, empty states, a responsive layout, keyboard focus styles and reduced-motion support.
- **CI:** a GitHub Actions workflow runs both test suites and the frontend build on every push.

## Screenshots

| | |
|---|---|
| ![Login](docs/screenshots/01-login.png) Login | ![Filtered](docs/screenshots/03-filtered.png) Filters (SUV under ₹16 lakh) |
| ![Purchase](docs/screenshots/04-purchase-toast.png) After buying a car | ![My purchases](docs/screenshots/05-my-purchases.png) My purchases |
| ![Admin](docs/screenshots/06-admin.png) Admin dashboard | ![Add vehicle](docs/screenshots/07-add-vehicle.png) Add vehicle |

<img src="docs/screenshots/08-mobile.png" alt="Mobile view" width="260">

## Running it locally

You need **Python 3.11+** and **Node 20+**.

### 1. Backend (port 8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                   # demo accounts + 16 cars (safe to re-run)
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger) are at http://localhost:8000/docs.

By default the data lives in `backend/dealership.db` (SQLite). To use PostgreSQL instead, set `DATABASE_URL` before starting:

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dealership
```

Other settings are listed in [`backend/.env.example`](backend/.env.example).

### 2. Frontend (port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` to the backend, so no CORS setup is needed in development.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@dealership.com | admin123 |
| Customer | customer@dealership.com | customer123 |

New sign-ups are always customers. Admins can only be created by the seed script (or directly in the database), so nobody can make themselves an admin through the API.

### Running the tests

```bash
cd backend && pytest --cov=app          # 70 tests
cd frontend && npm test                 # 37 tests
cd frontend && npm run coverage         # with coverage
```

## API

All routes except register and login need `Authorization: Bearer <token>`.

| Method | Path | Who | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | anyone | Create a customer account |
| POST | `/api/auth/login` | anyone | Returns `access_token` and the user |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/vehicles` | logged in | All vehicles, including sold-out ones |
| GET | `/api/vehicles/search` | logged in | Filters: `q`, `make`, `model`, `category`, `min_price`, `max_price`, `in_stock` |
| GET | `/api/vehicles/:id` | logged in | One vehicle |
| POST | `/api/vehicles` | admin | Add a vehicle |
| PUT | `/api/vehicles/:id` | admin | Update; send only the fields you want to change |
| DELETE | `/api/vehicles/:id` | admin | Delete; past orders are kept |
| POST | `/api/vehicles/:id/purchase` | logged in | Body `{"quantity": 1}` (optional). 409 if there isn't enough stock |
| POST | `/api/vehicles/:id/restock` | admin | Body `{"quantity": 5}` |
| GET | `/api/orders/me` | logged in | My purchases |
| GET | `/api/orders` | admin | All purchases |
| GET | `/api/stats` | admin | Dashboard numbers |

Errors always come back as `{"detail": "..."}` with a fitting status code (401, 403, 404, 409 or 422).

## Project structure

```
backend/
  app/
    main.py            app factory, CORS, maps domain errors to HTTP codes
    config.py          settings from environment variables
    database.py        engine and session
    models.py          User, Vehicle, Order
    schemas.py         Pydantic request/response models
    security.py        bcrypt hashing and JWT helpers
    deps.py            get_current_user, require_admin
    routers/           auth, vehicles, inventory, stats (thin: validate, call a service)
    services/          AuthService, VehicleService, InventoryService, StatsService
  tests/               one file per feature, fresh SQLite DB per test
  seed.py
frontend/
  src/
    api/client.js      fetch wrapper: adds the token, turns errors into messages
    context/           AuthContext (user, login, register, logout)
    components/        VehicleCard, FilterBar, VehicleForm, Modal, Toast, Navbar, ...
    pages/             Login, Register, Inventory, Orders, Admin
    utils/             price/stock formatting, filter -> query string
docs/
  TEST_REPORT.md
  screenshots/
```

## Design decisions

- **Services hold the logic and routers stay thin.** Services raise plain Python errors (`NotFoundError`, `ConflictError`, ...) and one handler in `main.py` turns them into HTTP responses. Business rules can be tested without HTTP, and each router only does validation and auth.
- **Adding and editing vehicles is admin-only, not just deleting.** The brief only marks delete and restock as admin, but it also says only admins get the add/edit forms, and a customer editing prices wouldn't make sense for a dealership.
- **Purchase is an atomic UPDATE**, not "read quantity, subtract, save". The read-then-write version passes a normal test but oversells when two requests arrive together.
- **Orders copy the price and car name** at the time of sale, so history doesn't change when an admin edits the price later.
- **SQLite by default** so the project runs with zero setup, but nothing is SQLite-specific. Search uses `lower()` + `contains` instead of `ILIKE`, so the same code works on Postgres.
- **The search route is declared before `/{id}`**, otherwise FastAPI tries to read "search" as a vehicle id.
- **Tests use a real database file per test**, not mocks. bcrypt's cost factor drops to 4 in tests, which took the suite from about 16 seconds to under 1.
- **Design:** the colours come from a car lot: tarmac grey, concrete background, and a yellow price tag like the stickers dealers put on windscreens. That price tag is the one bold element, and everything else is kept quiet. Fonts are Barlow and Barlow Condensed, bundled with the app so it works offline.

## Development process

The commit history follows red, green, refactor. Each feature starts with a `test:` commit containing failing tests, then a `feat:` commit that makes them pass, and sometimes a `refactor:` commit. One honest slip is visible in the history: `16b91e6` was committed with one failing test because the test's expectation was wrong ("ta" matches both Tata and Toyota). It was fixed in the next commit, `238c277`, and commits were gated on a passing suite after that.

## My AI Usage

### Tools used

- **Claude (Anthropic, model Claude Opus 5.5) in the claude.ai app**, with its code-execution workspace. This was the only AI tool used.

### How I used it

I want to be upfront: **Claude wrote nearly all of the code in this repository.** I gave it the kata brief, chose Python + FastAPI, and asked it to build the whole project. In the first session it:

- planned the structure and the extra features (overselling protection, order history, admin dashboard, URL-synced filters)
- wrote the backend tests first, then the code to pass them, then refactors. That is why every commit carries the `Co-authored-by: Claude` trailer
- wrote the React frontend and its tests
- ran both test suites, ran the app in a headless browser, took the screenshots in this README, and fixed what it noticed: a low-contrast warning colour, a broken mobile navbar, fonts not loading offline, and a Tailwind v4 build error
- wrote this README, the test report and the seed data

Every commit in this repo was made with AI involvement, so every commit has the co-author trailer.

The full, unedited conversation is linked in [PROMPTS.md](PROMPTS.md).

### What I worked on

- I chose Python and FastAPI for the backend, set up the project on my Mac, and published the repository to GitHub.
- I worked through the project requirements and used AI assistance during implementation, testing, and documentation. I also reviewed the generated work against the brief rather than treating the initial output as final.
- After completing the implementation, I used a separate Claude conversation to review the repository. It ran both test suites—70 backend tests and 37 frontend tests—and identified a few issues that needed attention.
- I checked and addressed the review findings, including missing co-author trailers in two commits, duplicate lines in `.gitignore`, and two sections of the documentation that were still incomplete.
- I also reviewed the project prompts and restored the original, unedited versions in `PROMPTS.md` to keep the record consistent with the brief's requirements.

### Reflection

- My main focus was getting the project to meet the brief, keeping the implementation practical, and checking that the final result worked as expected.
- AI assistance helped me move through implementation and testing much faster, but I learned that generating code is only one part of building a reliable project. The output still needs to be checked against the requirements and the actual state of the repository.
- The review process helped me catch issues I might otherwise have missed. For example, one test expectation was incorrect and had to be fixed in commit `238c277`. In another instance, the suggested starter files could have overwritten my existing backend, so I checked them against the current project before using anything.
- I recognise that I need a deeper understanding of some service implementations and tests. I'm reviewing those parts before the interview so I can explain the architecture, important decisions, edge cases, and testing approach clearly.
- Going forward, I'd like to take a more code-first approach: implement the core functionality myself, then use AI primarily for reviewing the design, identifying edge cases, debugging, and improving test coverage.

## Deployment

Not deployed yet. The simplest route would be the backend on Render or Railway with a managed Postgres (`DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGINS` set), and the frontend on Vercel with `VITE_API_URL` pointing at the backend.
