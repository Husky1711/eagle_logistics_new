import re
from typing import Self

from pydantic import BaseModel, Field, RootModel, field_validator, model_validator

_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")


class WeightRange(BaseModel):
    min: float = Field(ge=0)
    max: float = Field(gt=0)
    unit: str = "kg"

    @model_validator(mode="after")
    def min_less_than_max(self) -> Self:
        if self.min >= self.max:
            raise ValueError("weight_range.min must be less than max")
        return self


class DistanceZone(BaseModel):
    zone: str = Field(min_length=1, max_length=64)
    max_distance: float = Field(gt=0)
    unit: str = "km"
    base_price: float = Field(ge=0)
    price_per_kg: float = Field(ge=0)
    estimated_delivery: str = ""

    @field_validator("zone", "estimated_delivery")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class PricingRule(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    courier: str = Field(min_length=1, max_length=64)
    weight_range: WeightRange
    distance_zones: list[DistanceZone] = Field(min_length=1)
    active: bool = True

    @field_validator("id", "courier")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not _ID_PATTERN.match(normalized):
            raise ValueError("id and courier must be lowercase letters, numbers, hyphens, or underscores")
        return normalized


class PricingRulesDocument(RootModel[list[PricingRule]]):
    root: list[PricingRule] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_ids(self) -> Self:
        ids = [rule.id for rule in self.root]
        if len(ids) != len(set(ids)):
            raise ValueError("pricing rule ids must be unique")
        return self
