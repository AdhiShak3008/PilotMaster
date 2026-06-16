from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime

from datetime import datetime

from GaugePilot.backend.app.db.database import Base


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True)

    owner_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)

    leaderboard_json = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )
