package com.izisoft.pp09base.features.premium_success.ui.component

data class PremiumFeatureUi(
    val iconName: String,
    val title: String,
    val subtitle: String
)

data class PremiumOrderSummaryUi(
    val planName: String,
    val totalPrice: String,
    val transactionId: String
)
