package com.izisoft.pp09base.features.premium_success.data.api

import retrofit2.http.GET

interface PremiumSuccessApi {
    @GET("/purchase/success") // TODO
    suspend fun getSuccess(): PremiumDto
}

data class PremiumDto(val subscriptionId: String, val message: String?)
