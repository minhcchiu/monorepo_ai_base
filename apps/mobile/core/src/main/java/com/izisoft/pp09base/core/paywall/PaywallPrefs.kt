package com.izisoft.pp09base.core.paywall

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaywallPrefs @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    // main_paywall_closed_count
    fun getMainPaywallClosedCount(): Int = prefs.getInt(KEY_MAIN_PAYWALL_CLOSED_COUNT, 0)

    fun incrementMainPaywallClosedCount() {
        prefs.edit().putInt(KEY_MAIN_PAYWALL_CLOSED_COUNT, getMainPaywallClosedCount() + 1).apply()
    }

    // offer_paywall_shown_count
    fun getOfferPaywallShownCount(): Int = prefs.getInt(KEY_OFFER_PAYWALL_SHOWN_COUNT, 0)

    fun incrementOfferPaywallShownCount() {
        prefs.edit().putInt(KEY_OFFER_PAYWALL_SHOWN_COUNT, getOfferPaywallShownCount() + 1).apply()
    }

    // last_offer_paywall_shown_time
    fun getLastOfferPaywallShownTime(): Long = prefs.getLong(KEY_LAST_OFFER_PAYWALL_SHOWN_TIME, 0L)

    fun updateLastOfferPaywallShownTime(timestampMillis: Long = System.currentTimeMillis()) {
        prefs.edit().putLong(KEY_LAST_OFFER_PAYWALL_SHOWN_TIME, timestampMillis).apply()
    }

    // rewarded_ad_watch_count
    fun getRewardedAdWatchCount(): Int = prefs.getInt(KEY_REWARDED_AD_WATCH_COUNT, 0)

    fun incrementRewardedAdWatchCount() {
        prefs.edit().putInt(KEY_REWARDED_AD_WATCH_COUNT, getRewardedAdWatchCount() + 1).apply()
    }

    // scan_limit_reached_count
    fun getScanLimitReachedCount(): Int = prefs.getInt(KEY_SCAN_LIMIT_REACHED_COUNT, 0)

    fun incrementScanLimitReachedCount() {
        prefs.edit().putInt(KEY_SCAN_LIMIT_REACHED_COUNT, getScanLimitReachedCount() + 1).apply()
    }

    companion object {
        private const val PREFS_NAME = "paywall_prefs"
        private const val KEY_MAIN_PAYWALL_CLOSED_COUNT = "main_paywall_closed_count"
        private const val KEY_OFFER_PAYWALL_SHOWN_COUNT = "offer_paywall_shown_count"
        private const val KEY_LAST_OFFER_PAYWALL_SHOWN_TIME = "last_offer_paywall_shown_time"
        private const val KEY_REWARDED_AD_WATCH_COUNT = "rewarded_ad_watch_count"
        private const val KEY_SCAN_LIMIT_REACHED_COUNT = "scan_limit_reached_count"
        const val REWARDED_AD_THRESHOLD = 3
        const val OFFER_SHOWN_MAX = 2
        const val OFFER_COOLDOWN_MILLIS = 24L * 60L * 60L * 1000L // 24 hours
    }
}
