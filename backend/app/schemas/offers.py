from pydantic import BaseModel, Field


class OfferCta(BaseModel):
    text: str
    url: str


class OfferAlternate(BaseModel):
    title: str
    subtitle: str
    code: str = ""


class OffersDocument(BaseModel):
    active: bool
    title: str
    subtitle: str
    code: str = ""
    startDate: str = ""
    endDate: str = ""
    cta: OfferCta
    alternates: list[OfferAlternate] = Field(default_factory=list)
