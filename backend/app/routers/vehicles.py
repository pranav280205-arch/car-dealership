from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.schemas import VehicleCreate, VehicleOut, VehicleUpdate
from app.services.vehicle_service import SearchFilters, VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleOut], dependencies=[Depends(get_current_user)])
def list_vehicles(db: Session = Depends(get_db)):
    return VehicleService(db).list_all()


# Declared before /{vehicle_id} so "search" isn't parsed as an id.
@router.get(
    "/search", response_model=list[VehicleOut], dependencies=[Depends(get_current_user)]
)
def search_vehicles(
    q: str | None = None,
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    in_stock: bool = False,
    db: Session = Depends(get_db),
):
    filters = SearchFilters(q, make, model, category, min_price, max_price, in_stock)
    return VehicleService(db).search(filters)


@router.post(
    "",
    response_model=VehicleOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def add_vehicle(data: VehicleCreate, db: Session = Depends(get_db)):
    return VehicleService(db).create(data.model_dump())


@router.get(
    "/{vehicle_id}", response_model=VehicleOut, dependencies=[Depends(get_current_user)]
)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    return VehicleService(db).get(vehicle_id)


@router.put("/{vehicle_id}", response_model=VehicleOut, dependencies=[Depends(require_admin)])
def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db)):
    return VehicleService(db).update(vehicle_id, data.model_dump(exclude_unset=True))


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    VehicleService(db).delete(vehicle_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
