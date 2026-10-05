package com.izisoft.pp09base.features.offer_paywall.data.model

fun OfferPaywallPlanDto.toDomain(): OfferPaywallPlan = OfferPaywallPlan(
    id = id,
    title = title,
    priceText = priceText,
    periodLabel = periodLabel,
    trialDays = trialDays,
    badge = badge
)

fun OfferPaywallDto.toDomain(): OfferPaywallOffer = OfferPaywallOffer(
    offerId = offerId,
    headline = headline,
    subheadline = subheadline,
    benefits = benefits,
    plans = plans.map { it.toDomain() },
    defaultPlanId = defaultPlanId,
    closeButtonVisible = closeButtonVisible
)
