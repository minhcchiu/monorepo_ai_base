package com.izisoft.pp09base.features.profile.data.api

import com.izisoft.pp09base.features.profile.data.model.ProfileResponseDto
import com.izisoft.pp09base.features.profile.data.model.UpdateSettingsRequestDto
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Body

interface ProfileApi {
    @GET("/api/v1/users/me")
    suspend fun me(): ProfileResponseDto

    @POST("/api/v1/settings/update")
    suspend fun updateSettings(
        @Body request: UpdateSettingsRequestDto
    )
}
