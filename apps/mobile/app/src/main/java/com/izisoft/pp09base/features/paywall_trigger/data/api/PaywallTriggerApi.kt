package com.izisoft.pp09base.features.paywall_trigger.data.api

import retrofit2.http.POST

interface PaywallTriggerApi {
    @POST("/paywall/trigger") // TODO: real endpoint
    suspend fun trigger(): TriggerDto
}

data class TriggerDto(val triggered: Boolean)
