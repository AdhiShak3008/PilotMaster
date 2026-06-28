from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
)

from GaugePilot.backend.app.db.database import Base


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True)

    owner_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)

    results_json = Column(Text)

    leaderboard_json = Column(Text)

    analysis_json = Column(Text)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )
