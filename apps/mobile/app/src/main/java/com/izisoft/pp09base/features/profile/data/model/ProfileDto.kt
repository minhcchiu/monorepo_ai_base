package com.izisoft.pp09base.features.profile.data.model

import com.google.gson.annotations.SerializedName

data class ProfileResponseDto(
    @SerializedName("success")
    val success: Boolean? = null,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("data")
    val data: ProfileDataDto? = null,
    @SerializedName("timestamp")
    val timestamp: String? = null
)

data class ProfileDataDto(
    @SerializedName("id")
    val id: String? = null,
    @SerializedName("email")
    val email: String? = null,
    @SerializedName("firstName")
    val firstName: String? = null,
    @SerializedName("lastName")
    val lastName: String? = null,
    @SerializedName("avatar")
    val avatarUrl: String? = null
)
