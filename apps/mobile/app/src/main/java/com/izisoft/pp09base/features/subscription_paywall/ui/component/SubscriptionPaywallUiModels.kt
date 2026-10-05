package com.izisoft.pp09base.features.subscription_paywall.ui.component

data class PaywallBenefitItemUi(
    val iconKey: String,
    val title: String,
    val description: String
)

data class PaywallPlanUi(
    val id: String,
    val name: String,
    val price: String,
    val subtitle: String,
    val trialLabel: String? = null,
    val trialInfo: String? = null,
    val badge: String? = null
)

data class PaywallFooterLinkUi(
    val id: String,
    val label: String
)
