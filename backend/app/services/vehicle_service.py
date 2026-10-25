"""Vehicle catalogue operations."""
from dataclasses import dataclass

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.services.errors import DomainError, NotFoundError


@dataclass
class SearchFilters:
    q: str | None = None
    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock: bool = False


def _contains(column, text: str):
    """Case-insensitive 'contains' that works on both SQLite and Postgres."""
    return func.lower(column).contains(text.lower())


class VehicleService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Vehicle]:
        return list(self.db.scalars(select(Vehicle).order_by(Vehicle.id)))

    def search(self, f: SearchFilters) -> list[Vehicle]:
        if f.min_price is not None and f.max_price is not None and f.min_price > f.max_price:
            raise DomainError("min_price can't be greater than max_price")

        query = select(Vehicle)
        if f.q:
            query = query.where(or_(_contains(Vehicle.make, f.q), _contains(Vehicle.model, f.q)))
        if f.make:
            query = query.where(_contains(Vehicle.make, f.make))
        if f.model:
            query = query.where(_contains(Vehicle.model, f.model))
        if f.category:
            query = query.where(func.lower(Vehicle.category) == f.category.lower())
        if f.min_price is not None:
            query = query.where(Vehicle.price >= f.min_price)
        if f.max_price is not None:
            query = query.where(Vehicle.price <= f.max_price)
        if f.in_stock:
            query = query.where(Vehicle.quantity > 0)

        return list(self.db.scalars(query.order_by(Vehicle.id)))

    def get(self, vehicle_id: int) -> Vehicle:
        vehicle = self.db.get(Vehicle, vehicle_id)
        if vehicle is None:
            raise NotFoundError("Vehicle not found")
        return vehicle

    def create(self, data: dict) -> Vehicle:
        vehicle = Vehicle(**data)
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def update(self, vehicle_id: int, changes: dict) -> Vehicle:
        vehicle = self.get(vehicle_id)
        for field, value in changes.items():
            setattr(vehicle, field, value)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle_id: int) -> None:
        vehicle = self.get(vehicle_id)
        self.db.delete(vehicle)
        self.db.commit()
