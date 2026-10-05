package com.izisoft.pp09base.features.subscription_paywall.data.model

data class SubscriptionVerifyRequestDto(
    val platform: String,
    val productId: String,
    val purchaseToken: String
)

data class SubscriptionVerifyResponseDto(
    val success: Boolean? = null,
    val message: String? = null
)

data class SubscriptionVerifyResult(
    val isVerified: Boolean,
    val message: String?
)

fun SubscriptionVerifyResponseDto.toDomain(): SubscriptionVerifyResult {
    return SubscriptionVerifyResult(
        isVerified = success ?: true,
        message = message
    )
}
