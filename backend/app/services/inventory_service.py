"""Stock movements: purchases and restocks."""
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Order, Vehicle
from app.services.errors import ConflictError
from app.services.vehicle_service import VehicleService


class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.vehicles = VehicleService(db)

    def purchase(self, vehicle_id: int, user_id: int, quantity: int = 1) -> tuple[Order, Vehicle]:
        # One conditional UPDATE instead of "read quantity, then write it back".
        # If two buyers race for the last car, the database lets only one of
        # these statements match, so stock can never go negative.
        result = self.db.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.quantity >= quantity)
            .values(quantity=Vehicle.quantity - quantity)
        )
        if result.rowcount == 0:
            self.db.rollback()
            self.vehicles.get(vehicle_id)  # raises 404 if it doesn't exist
            raise ConflictError("Not enough stock for this purchase")

        vehicle = self.vehicles.get(vehicle_id)
        self.db.refresh(vehicle)
        order = Order(
            user_id=user_id,
            vehicle_id=vehicle.id,
            vehicle_name=vehicle.display_name,
            quantity=quantity,
            unit_price=vehicle.price,
        )
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        self.db.refresh(vehicle)
        return order, vehicle

    def restock(self, vehicle_id: int, quantity: int) -> Vehicle:
        self.vehicles.get(vehicle_id)  # 404 check
        self.db.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .values(quantity=Vehicle.quantity + quantity)
        )
        self.db.commit()
        vehicle = self.vehicles.get(vehicle_id)
        self.db.refresh(vehicle)
        return vehicle

    def orders_for_user(self, user_id: int) -> list[Order]:
        query = select(Order).where(Order.user_id == user_id).order_by(Order.id.desc())
        return list(self.db.scalars(query))

    def all_orders(self) -> list[Order]:
        return list(self.db.scalars(select(Order).order_by(Order.id.desc())))
