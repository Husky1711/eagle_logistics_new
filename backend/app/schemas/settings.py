from pydantic import BaseModel, Field


class NavItem(BaseModel):
    path: str
    label: str


class CtaButton(BaseModel):
    text: str
    url: str
    enabled: bool = True


class SiteInfo(BaseModel):
    name: str
    tagline: str
    description: str


class HeaderSettings(BaseModel):
    logo: str
    menuItems: list[NavItem]
    ctaButton: CtaButton


class FooterCountry(BaseModel):
    code: str
    name: str
    flag: str


class FooterSettings(BaseModel):
    description: str
    quickLinks: list[NavItem]
    supportLinks: list[NavItem]
    countries: list[FooterCountry] = Field(default_factory=list)


class ContactSettings(BaseModel):
    address: str
    phone: str
    whatsapp: str
    email: str
    hours: str = ""
    googleMapsUrl: str
    googleMapsEmbed: str = ""
    companyName: str = ""
    phoneSecondary: str = ""
    website: str = ""


class SocialSettings(BaseModel):
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""
    youtube: str = ""
    gmail: str = ""


class SettingsDocument(BaseModel):
    site: SiteInfo
    header: HeaderSettings
    footer: FooterSettings
    contact: ContactSettings
    social: SocialSettings
