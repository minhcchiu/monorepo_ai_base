package com.izisoft.pp09base.features.profile.data.repository

import com.izisoft.pp09base.features.profile.data.model.Profile
import com.izisoft.pp09base.features.profile.data.model.UpdateSettingsResult

interface ProfileRepository {
    suspend fun me(): Profile
    suspend fun logout()
    suspend fun updateSettings(language: String?, unit: String?, notifications: Boolean?): UpdateSettingsResult
}
