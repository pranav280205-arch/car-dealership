"""Database tables."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    make: Mapped[str] = mapped_column(String(50), index=True)
    model: Mapped[str] = mapped_column(String(50), index=True)
    category: Mapped[str] = mapped_column(String(30), index=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # asdecimal=False -> we get floats back, which is fine for whole-rupee prices
    price: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False))
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    @property
    def display_name(self) -> str:
        return f"{self.make} {self.model}"


class Order(Base):
    """One purchase. Copies the car's name and price at the time of sale so the
    record stays correct even if the vehicle is later edited or deleted."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    vehicle_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True
    )
    vehicle_name: Mapped[str] = mapped_column(String(110))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2, asdecimal=False))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    buyer: Mapped[User] = relationship()

    @property
    def total(self) -> float:
        return self.unit_price * self.quantity

    @property
    def buyer_email(self) -> str:
        return self.buyer.email
