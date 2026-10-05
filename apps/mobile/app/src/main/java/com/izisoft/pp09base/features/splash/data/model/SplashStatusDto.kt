package com.izisoft.pp09base.features.splash.data.model

import com.google.gson.annotations.SerializedName

data class GuestLoginRequestDto(
    @SerializedName("deviceId")
    val deviceId: String
)

data class GuestLoginResponseDto(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String,
    @SerializedName("data")
    val data: GuestSessionDto,
    @SerializedName("timestamp")
    val timestamp: String?
)

data class GuestSessionDto(
    @SerializedName("user")
    val user: GuestUserDto,
    @SerializedName("accessToken")
    val accessToken: String
)

data class GuestUserDto(
    @SerializedName("id")
    val id: String
)

data class AppInitRequestDto(
    @SerializedName("deviceId")
    val deviceId: String,
    @SerializedName("appVersion")
    val appVersion: String
)

data class AppInitResponseDto(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("message")
    val message: String,
    @SerializedName("data")
    val data: AppInitDataDto,
    @SerializedName("timestamp")
    val timestamp: String?
)

data class AppInitDataDto(
    @SerializedName("isFirstInstall")
    val isFirstInstall: Boolean,
    @SerializedName("isPremium")
    val isPremium: Boolean,
    @SerializedName("actionRemaining")
    val actionRemaining: Int,
    @SerializedName("showPaywall")
    val showPaywall: Boolean,
    @SerializedName("remoteConfig")
    val remoteConfig: RemoteConfigDto
)

data class RemoteConfigDto(
    @SerializedName("maxFreeAction")
    val maxFreeAction: Int,
    @SerializedName("adsEnabled")
    val adsEnabled: Boolean
)
