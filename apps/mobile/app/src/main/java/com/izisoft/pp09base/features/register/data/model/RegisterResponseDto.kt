package com.izisoft.pp09base.features.register.data.model

import com.google.gson.annotations.SerializedName

// Envelope shape matches the backend's BaseResponseDto<AuthResponseDto>
// (see apps/backend/src/modules/auth/dto/auth.dto.ts)
data class RegisterResponseDto(
    @SerializedName("success")
    val success: Boolean? = null,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("data")
    val data: AuthResponseDto? = null,
    @SerializedName("timestamp")
    val timestamp: String? = null
)

data class AuthResponseDto(
    @SerializedName("accessToken")
    val accessToken: String? = null,
    @SerializedName("refreshToken")
    val refreshToken: String? = null,
    @SerializedName("user")
    val user: AuthUserDto? = null
)

data class AuthUserDto(
    @SerializedName("id")
    val id: String? = null,
    @SerializedName("email")
    val email: String? = null,
    @SerializedName("firstName")
    val firstName: String? = null,
    @SerializedName("lastName")
    val lastName: String? = null,
    @SerializedName("role")
    val role: String? = null
)
