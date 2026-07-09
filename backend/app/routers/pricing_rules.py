from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.dependencies import require_admin
from app.schemas.pricing_rules import PricingRulesDocument
from app.services.content_store import ContentStore

router = APIRouter(prefix="/admin/pricing-rules", tags=["pricing-rules"])

store = ContentStore(settings.CONTENT_DIR, settings.REPO_ROOT)


def _reject_rule_id_renames(existing_ids: set[str], payload: PricingRulesDocument) -> None:
    payload_ids = {rule.id for rule in payload.root}
    removed = existing_ids - payload_ids
    added = payload_ids - existing_ids
    if removed and added:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Pricing rule id cannot be changed. Add a new rule and deactivate the old one "
                f"(removed: {', '.join(sorted(removed))}; added: {', '.join(sorted(added))})."
            ),
        )


def _validate_courier_references(payload: PricingRulesDocument) -> None:
    couriers = store.read("couriers.json")
    courier_ids = {item["id"] for item in couriers}
    unknown = sorted({rule.courier for rule in payload.root if rule.courier not in courier_ids})
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown courier id(s): {', '.join(unknown)}. Add the courier first or fix the reference.",
        )


@router.get("", response_model=PricingRulesDocument)
async def get_pricing_rules(_: str = Depends(require_admin)) -> PricingRulesDocument:
    data = store.read("pricing-rules.json")
    return PricingRulesDocument.model_validate(data)


@router.put("", response_model=PricingRulesDocument)
async def update_pricing_rules(
    payload: PricingRulesDocument,
    _: str = Depends(require_admin),
) -> PricingRulesDocument:
    existing = store.read("pricing-rules.json")
    existing_ids = {rule["id"] for rule in existing}
    _reject_rule_id_renames(existing_ids, payload)
    _validate_courier_references(payload)

    store.write("pricing-rules.json", payload.model_dump())
    store.sync_public_content()
    return payload
