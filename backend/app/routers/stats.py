"""Admin dashboard numbers."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.schemas import StatsOut
from app.services.stats_service import StatsService

router = APIRouter(prefix="/api", tags=["dashboard"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=StatsOut)
def dashboard_stats(db: Session = Depends(get_db)):
    return StatsService(db).summary()
