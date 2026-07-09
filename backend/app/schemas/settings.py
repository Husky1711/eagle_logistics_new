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


class FooterSettings(BaseModel):
    description: str
    quickLinks: list[NavItem]
    supportLinks: list[NavItem]


class ContactSettings(BaseModel):
    address: str
    phone: str
    whatsapp: str
    email: str
    hours: str
    googleMapsUrl: str
    googleMapsEmbed: str = ""


class SocialSettings(BaseModel):
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""


class SettingsDocument(BaseModel):
    site: SiteInfo
    header: HeaderSettings
    footer: FooterSettings
    contact: ContactSettings
    social: SocialSettings
