package com.izisoft.pp09base.features.splash.data.repository

import android.content.Context
import android.provider.Settings
import com.izisoft.pp09base.core.network.TokenStore
import com.izisoft.pp09base.core.ads.PremiumStatusManager
import com.izisoft.pp09base.features.splash.data.api.SplashApi
import com.izisoft.pp09base.features.splash.data.model.AppInitRequestDto
import com.izisoft.pp09base.features.splash.data.model.SplashLaunchResult
import com.izisoft.pp09base.features.splash.data.model.GuestLoginRequestDto
import com.izisoft.pp09base.features.splash.data.model.toDomain
import com.google.gson.JsonParser
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import javax.inject.Inject
import retrofit2.HttpException

class SplashRepository @Inject constructor(
    private val splashApi: SplashApi,
    @ApplicationContext private val context: Context,
    private val tokenStore: TokenStore,
    private val premiumStatusManager: PremiumStatusManager
) {
    suspend fun initializeSplash(): SplashLaunchResult {
        val deviceId = resolveDeviceId()
        val appVersion = resolveAppVersion()

        return try {
            val guestSession = splashApi.guestLogin(GuestLoginRequestDto(deviceId = deviceId)).toDomain()
            tokenStore.saveAccessToken(guestSession.accessToken)

            val subscriptionStatus = runCatching {
                splashApi.getSubscriptionStatus().toDomain()
            }.getOrNull()

            val appInitConfig = splashApi.initApp(
                request = AppInitRequestDto(
                    deviceId = deviceId,
                    appVersion = appVersion
                )
            ).toDomain()

            val isPremium = subscriptionStatus?.isPremium ?: appInitConfig.isPremium
            premiumStatusManager.setPremiumStatus(isPremium)

            SplashLaunchResult(
                userId = guestSession.userId,
                accessToken = guestSession.accessToken,
                initConfig = appInitConfig,
                subscriptionStatus = subscriptionStatus,
                isPremium = isPremium,
                shouldNavigateHome = tokenStore.hasEnteredHome()
            )
        } catch (exception: HttpException) {
            throw Exception(parseHttpError(exception))
        } catch (exception: IOException) {
            throw Exception("Network error. Please check your connection.")
        } catch (exception: Exception) {
            throw Exception(exception.message ?: "Unable to initialize app.")
        }
    }

    private fun resolveDeviceId(): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?: "unknown-device"
    }

    private fun resolveAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "1.0.0"
        } catch (_: Exception) {
            "1.0.0"
        }
    }

    private fun parseHttpError(exception: HttpException): String {
        val fallbackMessage = "Request failed (${exception.code()})."
        val errorBody = exception.response()?.errorBody()?.string() ?: return fallbackMessage

        return try {
            val json = JsonParser.parseString(errorBody).asJsonObject
            when {
                json.has("message") -> json.get("message").asString
                json.has("error") -> json.get("error").asString
                else -> fallbackMessage
            }
        } catch (_: Exception) {
            fallbackMessage
        }
    }
}
