package com.izisoft.pp09base.features.login.data.api

import com.izisoft.pp09base.features.login.data.model.LoginRequestDto
import com.izisoft.pp09base.features.login.data.model.LoginResponseDto
import retrofit2.http.Body
import retrofit2.http.POST

interface LoginApi {
    @POST("/api/v1/auth/login")
    suspend fun login(@Body request: LoginRequestDto): LoginResponseDto
}
