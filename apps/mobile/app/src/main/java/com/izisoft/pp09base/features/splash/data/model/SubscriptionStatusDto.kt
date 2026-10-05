package com.izisoft.pp09base.features.splash.data.model

import com.google.gson.annotations.SerializedName

data class SubscriptionStatusResponseDto(
    val success: Boolean? = null,
    val message: String? = null,
    val data: SubscriptionStatusDataDto? = null,
    val timestamp: String? = null
)

data class SubscriptionStatusDataDto(
    @SerializedName("isPremium")
    val isPremium: Boolean? = null,
    @SerializedName("is_premium")
    val isPremiumAlt: Boolean? = null,
    val plan: String? = null,
    val isTrial: Boolean? = null,
    val expiresAt: String? = null,
    val autoRenew: Boolean? = null,
    val status: String? = null
)