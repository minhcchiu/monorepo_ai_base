package com.izisoft.pp09base.features.register.data.api

import com.izisoft.pp09base.features.register.data.model.RegisterRequestDto
import com.izisoft.pp09base.features.register.data.model.RegisterResponseDto
import retrofit2.http.Body
import retrofit2.http.POST

interface RegisterApi {
    @POST("/api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequestDto): RegisterResponseDto
}
