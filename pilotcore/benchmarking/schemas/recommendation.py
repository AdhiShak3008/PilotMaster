from pydantic import BaseModel


class Recommendation(BaseModel):
    category: str
    title: str
    description: str
    configuration: str | None = None
