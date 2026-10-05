package com.izisoft.pp09base.features.splash.data.model

data class SubscriptionStatus(
    val isPremium: Boolean,
    val plan: String,
    val isTrial: Boolean,
    val expiresAt: String,
    val autoRenew: Boolean,
    val status: String
)