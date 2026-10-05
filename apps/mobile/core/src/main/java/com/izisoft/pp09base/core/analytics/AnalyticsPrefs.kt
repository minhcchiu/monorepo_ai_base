package com.izisoft.pp09base.core.analytics

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsPrefs @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun hasLoggedFirstOpen(): Boolean = prefs.getBoolean(KEY_HAS_LOGGED_FIRST_OPEN, false)

    fun setFirstOpenLogged(timestamp: Long) {
        prefs.edit()
            .putBoolean(KEY_HAS_LOGGED_FIRST_OPEN, true)
            .putLong(KEY_FIRST_OPEN_TIMESTAMP, timestamp)
            .apply()
    }

    fun getFirstOpenTimestamp(): Long = prefs.getLong(KEY_FIRST_OPEN_TIMESTAMP, 0L)

    fun hasLoggedRetentionD1(): Boolean = prefs.getBoolean(KEY_HAS_LOGGED_RETENTION_D1, false)

    fun setRetentionD1Logged() {
        prefs.edit().putBoolean(KEY_HAS_LOGGED_RETENTION_D1, true).apply()
    }

    companion object {
        private const val PREFS_NAME = "analytics_prefs"
        private const val KEY_HAS_LOGGED_FIRST_OPEN = "has_logged_first_open"
        private const val KEY_FIRST_OPEN_TIMESTAMP = "first_open_timestamp"
        private const val KEY_HAS_LOGGED_RETENTION_D1 = "has_logged_retention_d1"
    }
}
