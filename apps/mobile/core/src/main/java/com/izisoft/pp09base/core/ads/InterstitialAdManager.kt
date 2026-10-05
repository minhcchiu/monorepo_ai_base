package com.izisoft.pp09base.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.izisoft.pp09base.core.firebase.AppAnalytics
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InterstitialAdManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val premiumStatusManager: PremiumStatusManager,
    private val appAnalytics: AppAnalytics
) {
    private var interstitialAd: InterstitialAd? = null

    fun preload() {
        loadInterstitialAd(onLoaded = {}, onFailed = {})
    }

    fun showAd(
        activity: Activity,
        onDismissed: () -> Unit,
        onFailed: () -> Unit
    ) {
        if (premiumStatusManager.isPremium()) {
            appAnalytics.logAction("ad_interstitial_skipped_premium")
            onDismissed()
            return
        }

        fun showReadyAd(ad: InterstitialAd) {
            ad.fullScreenContentCallback = object : com.google.android.gms.ads.FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    appAnalytics.logAction("ad_interstitial_dismissed")
                    interstitialAd = null
                    preload()
                    onDismissed()
                }

                override fun onAdFailedToShowFullScreenContent(error: com.google.android.gms.ads.AdError) {
                    appAnalytics.logAction(
                        "ad_interstitial_show_failed",
                        mapOf("code" to error.code, "message" to error.message)
                    )
                    interstitialAd = null
                    preload()
                    onFailed()
                }
            }

            appAnalytics.logAction("ad_interstitial_shown")
            ad.show(activity)
        }

        interstitialAd?.let {
            showReadyAd(it)
            return
        }

        loadInterstitialAd(
            onLoaded = { loadedAd -> showReadyAd(loadedAd) },
            onFailed = { onFailed() }
        )
    }

    fun isReady(): Boolean = interstitialAd != null

    private fun loadInterstitialAd(
        onLoaded: (InterstitialAd) -> Unit,
        onFailed: () -> Unit
    ) {
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(
            context,
            AdConfig.INTERSTITIAL,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    appAnalytics.logAction("ad_interstitial_loaded")
                    interstitialAd = ad
                    onLoaded(ad)
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    appAnalytics.logAction(
                        "ad_interstitial_load_failed",
                        mapOf("code" to error.code, "message" to error.message)
                    )
                    interstitialAd = null
                    onFailed()
                }
            }
        )
    }
}
