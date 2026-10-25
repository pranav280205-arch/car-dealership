"""Fill the database with demo accounts and a starting inventory.

Run from the backend folder:  python seed.py
Safe to run more than once: existing users and cars are left alone.
"""
from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Vehicle
from app.services.auth_service import AuthService

DEMO_USERS = [
    ("Admin", "admin@dealership.com", "admin123", "admin"),
    ("Demo Customer", "customer@dealership.com", "customer123", "user"),
]

# (make, model, category, year, price in ₹, quantity, description)
DEMO_VEHICLES = [
    ("Maruti Suzuki", "Swift", "Hatchback", 2024, 699000, 8, "Peppy 1.2L petrol, great city car."),
    ("Maruti Suzuki", "Brezza", "SUV", 2024, 1150000, 5, "Compact SUV with a strong resale value."),
    ("Hyundai", "i20", "Hatchback", 2023, 845000, 4, "Premium hatch with a big touchscreen."),
    ("Hyundai", "Creta", "SUV", 2024, 1450000, 3, "Best-selling midsize SUV."),
    ("Hyundai", "Verna", "Sedan", 2023, 1300000, 2, "Turbo petrol, ventilated seats."),
    ("Tata", "Nexon EV", "Electric", 2024, 1490000, 6, "About 465 km claimed range."),
    ("Tata", "Punch", "SUV", 2024, 650000, 0, "Micro SUV, 5-star safety rating."),
    ("Tata", "Harrier", "SUV", 2023, 2150000, 1, "Diesel, 7 airbags, panoramic roof."),
    ("Mahindra", "Thar", "Off-road", 2024, 1500000, 2, "4x4 with removable roof."),
    ("Mahindra", "XUV700", "SUV", 2024, 2200000, 4, "Seven seats and ADAS."),
    ("Honda", "City", "Sedan", 2023, 1250000, 3, "Comfortable, refined petrol sedan."),
    ("Toyota", "Innova Hycross", "MPV", 2024, 2600000, 2, "Strong hybrid, very spacious."),
    ("Toyota", "Fortuner", "SUV", 2023, 3600000, 1, "Full-size 4x4, built to last."),
    ("Kia", "Seltos", "SUV", 2024, 1350000, 0, "Feature-packed with three engine options."),
    ("MG", "Comet EV", "Electric", 2024, 750000, 5, "Tiny two-door city EV."),
    ("Skoda", "Slavia", "Sedan", 2023, 1400000, 2, "Fun-to-drive 1.5 TSI."),
]


def seed():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        auth = AuthService(db)
        for name, email, password, role in DEMO_USERS:
            if not auth.find_by_email(email):
                auth.register(name, email, password, role=role)
                print(f"  user   {email} / {password} ({role})")

        if db.scalar(select(Vehicle.id).limit(1)) is None:
            for make, model, category, year, price, qty, desc in DEMO_VEHICLES:
                db.add(
                    Vehicle(
                        make=make, model=model, category=category, year=year,
                        price=price, quantity=qty, description=desc,
                    )
                )
            db.commit()
            print(f"  added  {len(DEMO_VEHICLES)} vehicles")
        else:
            print("  vehicles already present, skipped")


if __name__ == "__main__":
    print("Seeding database...")
    seed()
    print("Done.")
