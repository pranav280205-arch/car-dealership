"""Purchase, restock and order history endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import User
from app.schemas import (
    OrderOut,
    PurchaseOut,
    PurchaseRequest,
    RestockRequest,
    VehicleOut,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api", tags=["inventory"])


@router.post("/vehicles/{vehicle_id}/purchase", response_model=PurchaseOut)
def purchase_vehicle(
    vehicle_id: int,
    data: PurchaseRequest | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quantity = data.quantity if data else 1
    order, vehicle = InventoryService(db).purchase(vehicle_id, user.id, quantity)
    return PurchaseOut(
        order=OrderOut.model_validate(order), vehicle=VehicleOut.model_validate(vehicle)
    )


@router.post(
    "/vehicles/{vehicle_id}/restock",
    response_model=VehicleOut,
    dependencies=[Depends(require_admin)],
)
def restock_vehicle(vehicle_id: int, data: RestockRequest, db: Session = Depends(get_db)):
    return InventoryService(db).restock(vehicle_id, data.quantity)


@router.get("/orders/me", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return InventoryService(db).orders_for_user(user.id)


@router.get("/orders", response_model=list[OrderOut], dependencies=[Depends(require_admin)])
def all_orders(db: Session = Depends(get_db)):
    return InventoryService(db).all_orders()
