package com.izisoft.pp09base.features.profile.data.repository

import com.izisoft.pp09base.features.profile.data.api.ProfileApi
import com.izisoft.pp09base.features.profile.data.model.Profile
import com.izisoft.pp09base.features.profile.data.model.UpdateSettingsRequestDto
import com.izisoft.pp09base.features.profile.data.model.UpdateSettingsResult
import com.izisoft.pp09base.features.profile.data.model.toDomain
import com.izisoft.pp09base.core.network.TokenStore
import java.io.IOException
import retrofit2.HttpException
import javax.inject.Inject

class ProfileRepositoryImpl @Inject constructor(
    private val api: ProfileApi,
    private val tokenStore: TokenStore
) : ProfileRepository {
    override suspend fun me(): Profile {
        val dto = api.me()
        return dto.toDomain()
    }

    override suspend fun logout() {
        tokenStore.clearAccessToken()
        tokenStore.clearHasEnteredHome()
    }

    override suspend fun updateSettings(
        language: String?,
        unit: String?,
        notifications: Boolean?
    ): UpdateSettingsResult {
        try {
            val request = UpdateSettingsRequestDto(
                language = language,
                unit = unit,
                notificationsEnabled = notifications
            )
            api.updateSettings(request)
            return UpdateSettingsResult(success = true)
        } catch (e: HttpException) {
            val errorBody = e.response()?.errorBody()?.string()?.takeIf { it.isNotBlank() }
            throw Exception(errorBody ?: "Failed to update settings")
        } catch (e: IOException) {
            throw Exception("Network error while updating settings")
        } catch (e: Exception) {
            throw Exception(e.message ?: "Error updating settings")
        }
    }
}
