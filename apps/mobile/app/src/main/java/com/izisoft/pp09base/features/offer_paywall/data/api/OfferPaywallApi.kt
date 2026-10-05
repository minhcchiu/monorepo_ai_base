package com.izisoft.pp09base.features.offer_paywall.data.api

import retrofit2.http.Body
import retrofit2.http.POST

interface OfferPaywallApi {
    @POST("/api/v1/subscription/verify")
    suspend fun verifyPurchase(
        @Body request: OfferPaywallVerifyRequestDto
    ): OfferPaywallVerifyResultDto
}

data class OfferPaywallVerifyRequestDto(
    val platform: String,
    val productId: String,
    val purchaseToken: String
)

data class OfferPaywallVerifyResultDto(
    val success: Boolean? = null,
    val message: String? = null
)
