"""Numbers for the admin dashboard."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Order, Vehicle

LOW_STOCK_THRESHOLD = 2


class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def summary(self) -> dict:
        total_models, units, value = self.db.execute(
            select(
                func.count(Vehicle.id),
                func.coalesce(func.sum(Vehicle.quantity), 0),
                func.coalesce(func.sum(Vehicle.quantity * Vehicle.price), 0),
            )
        ).one()

        units_sold, revenue = self.db.execute(
            select(
                func.coalesce(func.sum(Order.quantity), 0),
                func.coalesce(func.sum(Order.quantity * Order.unit_price), 0),
            )
        ).one()

        low_stock = self.db.scalars(
            select(Vehicle)
            .where(Vehicle.quantity <= LOW_STOCK_THRESHOLD)
            .order_by(Vehicle.quantity, Vehicle.id)
        ).all()

        by_category = self.db.execute(
            select(Vehicle.category, func.count(Vehicle.id), func.sum(Vehicle.quantity))
            .group_by(Vehicle.category)
            .order_by(Vehicle.category)
        ).all()

        return {
            "total_models": total_models,
            "units_in_stock": int(units),
            "stock_value": float(value),
            "units_sold": int(units_sold),
            "revenue": float(revenue),
            "low_stock": low_stock,
            "by_category": [
                {"category": c, "models": m, "units": int(u)} for c, m, u in by_category
            ],
        }
