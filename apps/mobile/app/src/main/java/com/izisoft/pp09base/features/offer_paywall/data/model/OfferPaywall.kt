package com.izisoft.pp09base.features.offer_paywall.data.model

data class OfferPaywallPlan(
    val id: String,
    val title: String,
    val priceText: String,
    val periodLabel: String,
    val trialDays: Int? = null,
    val badge: String? = null
)

data class OfferPaywallOffer(
    val offerId: String,
    val headline: String,
    val subheadline: String,
    val benefits: List<String>,
    val plans: List<OfferPaywallPlan>,
    val defaultPlanId: String,
    val closeButtonVisible: Boolean = true
)
