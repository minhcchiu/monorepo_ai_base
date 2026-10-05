package com.izisoft.pp09base.features.profile_subscription.data.api

import com.izisoft.pp09base.features.profile_subscription.data.model.SubscriptionResponseDto
import retrofit2.http.GET

interface ProfileSubscriptionApi {
    @GET("/api/v1/subscription/status")
    suspend fun getSubscription(): SubscriptionResponseDto
}
