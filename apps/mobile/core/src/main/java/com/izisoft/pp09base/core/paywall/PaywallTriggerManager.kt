package com.izisoft.pp09base.core.paywall

import com.izisoft.pp09base.core.firebase.AppAnalytics
import com.izisoft.pp09base.core.paywall.PaywallPrefs.Companion.OFFER_COOLDOWN_MILLIS
import com.izisoft.pp09base.core.paywall.PaywallPrefs.Companion.OFFER_SHOWN_MAX
import com.izisoft.pp09base.core.paywall.PaywallPrefs.Companion.REWARDED_AD_THRESHOLD
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaywallTriggerManager @Inject constructor(
    private val prefs: PaywallPrefs,
    private val analytics: AppAnalytics
) {
    /**
     * Returns true if the offer paywall should be shown.
     *
     * Conditions:
     * - user is NOT premium
     * - offer_paywall_shown_count < 2
     * - last_offer_paywall_shown_time is older than 24h or has never been shown
     * - no ad is currently showing
     * - no purchase flow is open
     * - subscription_paywall is not currently visible
     * - app is not loading
     */
    fun shouldShowOfferPaywall(
        isPremium: Boolean,
        isAdShowing: Boolean = false,
        isPurchaseFlowOpen: Boolean = false,
        isPaywallVisible: Boolean = false,
        isLoading: Boolean = false
    ): Boolean {
        if (isPremium) return false
        if (isAdShowing || isPurchaseFlowOpen || isPaywallVisible || isLoading) return false

        val shownCount = prefs.getOfferPaywallShownCount()
        if (shownCount >= OFFER_SHOWN_MAX) return false

        val lastShown = prefs.getLastOfferPaywallShownTime()
        if (lastShown > 0L && System.currentTimeMillis() - lastShown < OFFER_COOLDOWN_MILLIS) return false

        analytics.logAction(
            "offer_paywall_trigger_checked",
            mapOf(
                "result" to "show",
                "shown_count" to shownCount,
                "main_paywall_closed_count" to prefs.getMainPaywallClosedCount(),
                "rewarded_ad_watch_count" to prefs.getRewardedAdWatchCount()
            )
        )
        return true
    }

    /**
     * Call when the subscription (main) paywall is closed by the user without purchase.
     * Increments [main_paywall_closed_count], logs analytics.
     * Returns whether offer paywall should be shown.
     */
    fun onSubscriptionPaywallClosed(
        source: String = "subscription_close",
        isPremium: Boolean = false
    ): Boolean {
        prefs.incrementMainPaywallClosedCount()
        analytics.logAction(
            "subscription_paywall_dismissed",
            mapOf(
                "source" to source,
                "main_paywall_closed_count" to prefs.getMainPaywallClosedCount()
            )
        )
        return shouldShowOfferPaywall(isPremium = isPremium)
    }

    /**
     * Call just before showing the offer paywall.
     * Increments shown count, updates timestamp, logs analytics.
     */
    fun onOfferPaywallAboutToShow(source: String = "subscription_close") {
        prefs.incrementOfferPaywallShownCount()
        prefs.updateLastOfferPaywallShownTime()
        analytics.logAction(
            "offer_paywall_shown",
            mapOf(
                "source" to source,
                "shown_count" to prefs.getOfferPaywallShownCount(),
                "main_paywall_closed_count" to prefs.getMainPaywallClosedCount(),
                "rewarded_ad_watch_count" to prefs.getRewardedAdWatchCount()
            )
        )
    }

    /**
     * Call when the offer paywall is dismissed/closed by the user.
     */
    fun onOfferPaywallDismissed(source: String = "offer_close") {
        analytics.logAction(
            "offer_paywall_dismissed",
            mapOf(
                "source" to source,
                "shown_count" to prefs.getOfferPaywallShownCount()
            )
        )
    }

    /**
     * Call when offer purchase is started (CTA tapped).
     */
    fun onOfferPurchaseStarted(source: String = "offer_paywall") {
        analytics.logAction(
            "offer_purchase_started",
            mapOf("source" to source, "shown_count" to prefs.getOfferPaywallShownCount())
        )
    }

    /**
     * Call when a rewarded ad has been successfully watched.
     * Increments rewarded_ad_watch_count.
     * Returns whether offer paywall should be shown (i.e., threshold reached + shouldShow).
     */
    fun onRewardedAdWatched(isPremium: Boolean = false): Boolean {
        prefs.incrementRewardedAdWatchCount()
        val count = prefs.getRewardedAdWatchCount()
        return if (count >= REWARDED_AD_THRESHOLD) {
            shouldShowOfferPaywall(isPremium = isPremium)
        } else false
    }

    /**
     * Call when user hits the scan limit (triggering upgrade prompt).
     */
    fun onScanLimitReached() {
        prefs.incrementScanLimitReachedCount()
    }
}
