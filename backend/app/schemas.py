"""Request and response shapes (Pydantic)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- vehicles ----------

class VehicleCreate(BaseModel):
    make: str = Field(min_length=1, max_length=50)
    model: str = Field(min_length=1, max_length=50)
    category: str = Field(min_length=1, max_length=30)
    year: int | None = Field(default=None, ge=1900, le=2100)
    price: float = Field(ge=0)
    quantity: int = Field(default=0, ge=0)
    description: str | None = Field(default=None, max_length=1000)


class VehicleUpdate(BaseModel):
    """All fields optional; only the ones sent are changed."""

    make: str | None = Field(default=None, min_length=1, max_length=50)
    model: str | None = Field(default=None, min_length=1, max_length=50)
    category: str | None = Field(default=None, min_length=1, max_length=30)
    year: int | None = Field(default=None, ge=1900, le=2100)
    price: float | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=0)
    description: str | None = Field(default=None, max_length=1000)


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    year: int | None
    price: float
    quantity: int
    description: str | None


# ---------- inventory ----------

class PurchaseRequest(BaseModel):
    quantity: int = Field(default=1, ge=1, le=50)


class RestockRequest(BaseModel):
    quantity: int = Field(ge=1, le=1000)


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int | None
    vehicle_name: str
    quantity: int
    unit_price: float
    total: float
    buyer_email: str
    created_at: datetime


class PurchaseOut(BaseModel):
    order: OrderOut
    vehicle: VehicleOut
