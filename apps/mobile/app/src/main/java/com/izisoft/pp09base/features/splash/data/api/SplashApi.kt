package com.izisoft.pp09base.features.splash.data.api

import com.izisoft.pp09base.features.splash.data.model.AppInitRequestDto
import com.izisoft.pp09base.features.splash.data.model.AppInitResponseDto
import com.izisoft.pp09base.features.splash.data.model.GuestLoginRequestDto
import com.izisoft.pp09base.features.splash.data.model.GuestLoginResponseDto
import com.izisoft.pp09base.features.splash.data.model.SubscriptionStatusResponseDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface SplashApi {
    @POST("/api/v1/auth/guest")
    suspend fun guestLogin(
        @Body request: GuestLoginRequestDto
    ): GuestLoginResponseDto

    @POST("/api/v1/app/init")
    suspend fun initApp(
        @Body request: AppInitRequestDto
    ): AppInitResponseDto

    @GET("/api/v1/subscription/status")
    suspend fun getSubscriptionStatus(): SubscriptionStatusResponseDto
}
