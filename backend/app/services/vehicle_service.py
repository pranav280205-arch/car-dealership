"""Vehicle catalogue operations."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Vehicle
from app.services.errors import NotFoundError


class VehicleService:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Vehicle]:
        return list(self.db.scalars(select(Vehicle).order_by(Vehicle.id)))

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
