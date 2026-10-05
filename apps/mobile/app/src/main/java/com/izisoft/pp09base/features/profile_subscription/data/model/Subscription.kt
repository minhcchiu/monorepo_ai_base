package com.izisoft.pp09base.features.profile_subscription.data.model

data class Subscription(
    val isPremium: Boolean,
    val plan: String? = null,
    val isTrial: Boolean = false,
    val expiresAt: String? = null,
    val autoRenew: Boolean = true,
    val status: String? = null
)
