package com.izisoft.pp09base.features.offer_paywall.data.model

data class OfferPaywallPlanDto(
    val id: String,
    val title: String,
    val priceText: String,
    val periodLabel: String,
    val trialDays: Int? = null,
    val badge: String? = null
)

data class OfferPaywallDto(
    val offerId: String,
    val headline: String,
    val subheadline: String,
    val benefits: List<String>,
    val plans: List<OfferPaywallPlanDto>,
    val defaultPlanId: String,
    val closeButtonVisible: Boolean = true
)

data class OfferPaywallPurchaseRequestDto(
    val planId: String,
    val source: String = "offer_paywall"
)

data class OfferPaywallPurchaseResultDto(
    val success: Boolean,
    val transactionId: String? = null
)

data class OfferPaywallRestoreResultDto(
    val success: Boolean,
    val restoredCount: Int = 0
)
