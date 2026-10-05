package com.izisoft.pp09base.core.firebase

import android.content.Context
import android.os.Bundle
import com.google.firebase.analytics.FirebaseAnalytics
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppAnalytics @Inject constructor(
    @ApplicationContext context: Context
) {
    private val firebaseAnalytics: FirebaseAnalytics = FirebaseAnalytics.getInstance(context)

    fun logScreen(route: String?) {
        val screenName = route.toScreenName()
        val params = Bundle().apply {
            putString(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            putString(FirebaseAnalytics.Param.SCREEN_CLASS, "MainActivity")
            putString("route", route.orEmpty())
        }
        firebaseAnalytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, params)
    }

    fun logAction(eventName: String, params: Map<String, Any?> = emptyMap()) {
        val bundle = Bundle()
        params.forEach { (key, value) ->
            val safeKey = key.toAnalyticsKey()
            when (value) {
                null -> Unit
                is String -> bundle.putString(safeKey, value.take(100))
                is Int -> bundle.putInt(safeKey, value)
                is Long -> bundle.putLong(safeKey, value)
                is Float -> bundle.putFloat(safeKey, value)
                is Double -> bundle.putDouble(safeKey, value)
                is Boolean -> bundle.putString(safeKey, if (value) "1" else "0")
                else -> bundle.putString(safeKey, value.toString().take(100))
            }
        }
        firebaseAnalytics.logEvent(eventName.toAnalyticsEventName(), bundle)
    }

    fun setPremiumUser(isPremium: Boolean) {
        firebaseAnalytics.setUserProperty("is_premium", if (isPremium) "1" else "0")
    }

    private fun String?.toScreenName(): String {
        val raw = this.orEmpty().substringBefore("?")
        val normalized = when {
            raw.startsWith("collection_list/") -> "collection_list"
            raw.isBlank() -> "unknown"
            else -> raw
        }
        return normalized.toAnalyticsEventName().take(40)
    }

    private fun String.toAnalyticsEventName(): String {
        return lowercase()
            .replace(Regex("[^a-z0-9_]+"), "_")
            .trim('_')
            .ifBlank { "event_unknown" }
            .take(40)
    }

    private fun String.toAnalyticsKey(): String {
        return lowercase()
            .replace(Regex("[^a-z0-9_]+"), "_")
            .trim('_')
            .ifBlank { "param" }
            .take(40)
    }
}
