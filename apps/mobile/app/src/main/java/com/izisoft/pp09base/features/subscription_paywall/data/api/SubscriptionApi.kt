package com.izisoft.pp09base.features.subscription_paywall.data.api

import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionVerifyRequestDto
import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionVerifyResponseDto
import retrofit2.http.Body
import retrofit2.http.POST

interface SubscriptionApi {
    @POST("/api/v1/subscription/verify")
    suspend fun verifySubscription(
        @Body request: SubscriptionVerifyRequestDto
    ): SubscriptionVerifyResponseDto
}
