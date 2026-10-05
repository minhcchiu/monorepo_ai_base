package com.izisoft.pp09base.features.offline_state.data.api

import com.izisoft.pp09base.features.offline_state.data.model.OfflineStateDto
import retrofit2.http.GET

interface OfflineStateApi {
    @GET("/offline/state")
    suspend fun getState(): OfflineStateDto
}
