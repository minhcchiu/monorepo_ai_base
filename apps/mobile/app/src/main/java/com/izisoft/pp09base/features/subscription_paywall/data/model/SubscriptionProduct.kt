package com.izisoft.pp09base.features.subscription_paywall.data.model

data class SubscriptionProduct(
    val id: String,
    val name: String,
    val price: String,
    val description: String?,
    val billingPeriod: String = ""
)
