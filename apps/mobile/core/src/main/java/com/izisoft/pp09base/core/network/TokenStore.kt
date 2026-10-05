package com.izisoft.pp09base.core.network

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @Volatile
    private var cachedAccessToken: String? = null

    fun saveAccessToken(token: String) {
        cachedAccessToken = token
        prefs
            .edit()
            .putString(KEY_ACCESS_TOKEN, token)
            .commit()
    }

    fun getAccessToken(): String? {
        return cachedAccessToken ?: prefs.getString(KEY_ACCESS_TOKEN, null)?.also {
            cachedAccessToken = it
        }
    }

    fun clearAccessToken() {
        cachedAccessToken = null
        prefs
            .edit()
            .remove(KEY_ACCESS_TOKEN)
            .commit()
    }

    fun saveHasEnteredHome(value: Boolean) {
        prefs
            .edit()
            .putBoolean(KEY_HAS_ENTERED_HOME, value)
            .apply()
    }

    fun hasEnteredHome(): Boolean {
        return prefs
            .getBoolean(KEY_HAS_ENTERED_HOME, false)
    }

    fun clearHasEnteredHome() {
        prefs
            .edit()
            .remove(KEY_HAS_ENTERED_HOME)
            .apply()
    }

    fun saveSelectedLanguageCode(languageCode: String) {
        prefs
            .edit()
            .putString(KEY_SELECTED_LANGUAGE_CODE, languageCode)
            .apply()
    }

    fun getSelectedLanguageCode(): String? {
        return prefs
            .getString(KEY_SELECTED_LANGUAGE_CODE, null)
    }

    companion object {
        private const val PREFS_NAME = "pp03baseandroid_app_prefs"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_HAS_ENTERED_HOME = "has_entered_home"
        private const val KEY_SELECTED_LANGUAGE_CODE = "selected_language_code"
    }
}
