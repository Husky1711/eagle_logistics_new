from pydantic import BaseModel, Field


class OffersPageSection(BaseModel):
    id: str = ""
    title: str = ""
    subtitle: str = ""
    lead: str = ""
    reassure: str = ""
    body: list[str] = Field(default_factory=list)
    featuresTitle: str = ""
    features: list[str] = Field(default_factory=list)


class OffersPagePromoCard(BaseModel):
    line1: str = ""
    line2: str = ""
    image: str = ""
    items: list[str] = Field(default_factory=list)
    disclaimer: str = ""


class OffersPageMeta(BaseModel):
    title: str = ""
    description: str = ""
    image: str | None = None
    imageAlt: str | None = None


class OffersPageContent(BaseModel):
    title: str = ""
    heroImage: str = ""
    headline: str = ""
    lead: str = ""
    reassure: str = ""
    body: list[str] = Field(default_factory=list)
    featuresTitle: str = ""
    features: list[str] = Field(default_factory=list)
    offerNote: str = ""
    promoCard: OffersPagePromoCard = Field(default_factory=OffersPagePromoCard)
    # Keep extra campaign sections intact even if MVP UI does not edit them yet
    sections: list[OffersPageSection] = Field(default_factory=list)
    whatsappCta: str = ""
    ctaDefault: str = ""
    currentPromoLabel: str = ""


class OffersPageDocument(BaseModel):
    meta: OffersPageMeta = Field(default_factory=OffersPageMeta)
    content: OffersPageContent = Field(default_factory=OffersPageContent)
