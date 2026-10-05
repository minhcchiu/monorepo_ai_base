package com.izisoft.pp09base.core.rating

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RatingPrefs @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getScanCount(): Int = prefs.getInt(KEY_SCAN_COUNT, 0)

    fun incrementScanCount() {
        prefs.edit().putInt(KEY_SCAN_COUNT, getScanCount() + 1).apply()
    }

    fun getSuccessfulScanCount(): Int = prefs.getInt(KEY_SUCCESSFUL_SCAN_COUNT, 0)

    fun incrementSuccessfulScanCount() {
        prefs.edit().putInt(KEY_SUCCESSFUL_SCAN_COUNT, getSuccessfulScanCount() + 1).apply()
    }

    fun getAppOpenCount(): Int = prefs.getInt(KEY_APP_OPEN_COUNT, 0)

    fun incrementAppOpenCount() {
        prefs.edit().putInt(KEY_APP_OPEN_COUNT, getAppOpenCount() + 1).apply()
    }

    fun getLastReviewAskTime(): Long = prefs.getLong(KEY_LAST_REVIEW_ASK_TIME, 0L)

    fun updateLastReviewAskTime(timestampMillis: Long = System.currentTimeMillis()) {
        prefs.edit().putLong(KEY_LAST_REVIEW_ASK_TIME, timestampMillis).apply()
    }

    fun hasUserSelectedHighRating(): Boolean = prefs.getBoolean(KEY_HAS_USER_SELECTED_HIGH_RATING, false)

    fun setUserSelectedHighRating(value: Boolean) {
        prefs.edit().putBoolean(KEY_HAS_USER_SELECTED_HIGH_RATING, value).apply()
    }

    fun hasUserSubmittedFeedback(): Boolean = prefs.getBoolean(KEY_HAS_USER_SUBMITTED_FEEDBACK, false)

    fun setUserSubmittedFeedback(value: Boolean) {
        prefs.edit().putBoolean(KEY_HAS_USER_SUBMITTED_FEEDBACK, value).apply()
    }

    companion object {
        private const val PREFS_NAME = "rating_prefs"
        private const val KEY_SCAN_COUNT = "scan_count"
        private const val KEY_SUCCESSFUL_SCAN_COUNT = "successful_scan_count"
        private const val KEY_APP_OPEN_COUNT = "app_open_count"
        private const val KEY_LAST_REVIEW_ASK_TIME = "last_review_ask_time"
        private const val KEY_HAS_USER_SELECTED_HIGH_RATING = "has_user_selected_high_rating"
        private const val KEY_HAS_USER_SUBMITTED_FEEDBACK = "has_user_submitted_feedback"
    }
}
