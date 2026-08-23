from pydantic import BaseModel, Field


class HomePageMeta(BaseModel):
    title: str = ""
    description: str = ""
    image: str | None = None
    imageAlt: str | None = None


class HomePageHero(BaseModel):
    brand: str = ""
    headline: str = ""
    subheadline: str = ""
    promo: str = ""
    cta: str = ""
    ctaLink: str = ""


class HomePageIntro(BaseModel):
    title: str = ""
    sectionTitle: str = ""
    body: str = ""
    readMoreLabel: str = ""
    readMoreLink: str = ""


class HomePageMission(BaseModel):
    title: str = ""
    image: str = ""
    imageAlt: str = ""
    items: list[str] = Field(default_factory=list)


class HomePageServiceCard(BaseModel):
    id: str = ""
    title: str = ""
    body: str = ""
    image: str = ""
    link: str = ""
    linkLabel: str = ""


class HomePageAdvantageItem(BaseModel):
    id: str = ""
    text: str = ""
    icon: str = ""
    iconImage: str = ""
    link: str = ""


class HomePageAdvantages(BaseModel):
    title: str = ""
    items: list[HomePageAdvantageItem] = Field(default_factory=list)


class HomePagePopularItem(BaseModel):
    id: str = ""
    title: str = ""
    slug: str = ""
    image: str = ""


class HomePagePopularItems(BaseModel):
    title: str = ""
    viewAllLabel: str = ""
    viewAllLink: str = ""
    items: list[HomePagePopularItem] = Field(default_factory=list)


class HomePageTestimonial(BaseModel):
    id: int = 0
    quote: str = ""
    name: str = ""
    location: str = ""


class HomePageTestimonials(BaseModel):
    title: str = ""
    items: list[HomePageTestimonial] = Field(default_factory=list)


class HomePageCargoItem(BaseModel):
    id: str = ""
    title: str = ""
    slug: str = ""
    image: str = ""
    summary: str = ""


class HomePageCargo(BaseModel):
    title: str = ""
    items: list[HomePageCargoItem] = Field(default_factory=list)


class HomePageCta(BaseModel):
    title: str = ""
    subtitle: str = ""
    button: str = ""
    buttonLink: str = ""
    secondaryButton: str = ""
    secondaryButtonLink: str = ""


class HomePageContent(BaseModel):
    hero: HomePageHero = Field(default_factory=HomePageHero)
    heroImages: list[str] = Field(default_factory=list)
    intro: HomePageIntro = Field(default_factory=HomePageIntro)
    mission: HomePageMission = Field(default_factory=HomePageMission)
    serviceCards: list[HomePageServiceCard] = Field(default_factory=list)
    advantages: HomePageAdvantages = Field(default_factory=HomePageAdvantages)
    popularItems: HomePagePopularItems = Field(default_factory=HomePagePopularItems)
    testimonials: HomePageTestimonials = Field(default_factory=HomePageTestimonials)
    cargo: HomePageCargo = Field(default_factory=HomePageCargo)
    cta: HomePageCta = Field(default_factory=HomePageCta)


class HomePageDocument(BaseModel):
    meta: HomePageMeta = Field(default_factory=HomePageMeta)
    content: HomePageContent = Field(default_factory=HomePageContent)
