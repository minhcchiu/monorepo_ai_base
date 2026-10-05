package com.izisoft.pp09base.features.profile.data.model

import com.google.gson.annotations.SerializedName

data class UpdateSettingsRequestDto(
    @SerializedName("language")
    val language: String? = null,
    @SerializedName("unit")
    val unit: String? = null,
    @SerializedName("notificationsEnabled")
    val notificationsEnabled: Boolean? = null
)

data class UpdateSettingsResult(
    val success: Boolean
)
