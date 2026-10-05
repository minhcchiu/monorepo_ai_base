package com.izisoft.pp09base.features.profile_subscription.data.model

import com.google.gson.annotations.SerializedName

data class SubscriptionResponseDto(
    @SerializedName("success")
    val success: Boolean? = null,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("data")
    val data: SubscriptionDataDto? = null,
    @SerializedName("timestamp")
    val timestamp: String? = null
)

data class SubscriptionDataDto(
    @SerializedName("isPremium")
    val isPremium: Boolean? = null,
    @SerializedName("plan")
    val plan: String? = null,
    @SerializedName("isTrial")
    val isTrial: Boolean? = null,
    @SerializedName("expiresAt")
    val expiresAt: String? = null,
    @SerializedName("autoRenew")
    val autoRenew: Boolean? = null,
    @SerializedName("status")
    val status: String? = null
)
