package com.izisoft.pp09base.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.izisoft.pp09base.core.firebase.AppAnalytics
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RewardedAdManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val premiumStatusManager: PremiumStatusManager,
    private val appAnalytics: AppAnalytics
) {
    private var rewardedAd: RewardedAd? = null

    fun initialize() {
        MobileAds.initialize(context)
        preload()
    }

    fun preload() {
        loadRewardedAd(onLoaded = {}, onFailed = {})
    }

    fun showAd(
        activity: Activity,
        onRewarded: () -> Unit,
        onDismissed: () -> Unit,
        onFailed: () -> Unit
    ) {
        if (premiumStatusManager.isPremium()) {
            appAnalytics.logAction("ad_rewarded_skipped_premium")
            onDismissed()
            return
        }

        fun showReadyAd(ad: RewardedAd) {
            ad.fullScreenContentCallback = object : com.google.android.gms.ads.FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    appAnalytics.logAction("ad_rewarded_dismissed")
                    rewardedAd = null
                    preload()
                    onDismissed()
                }

                override fun onAdFailedToShowFullScreenContent(error: com.google.android.gms.ads.AdError) {
                    appAnalytics.logAction(
                        "ad_rewarded_show_failed",
                        mapOf("code" to error.code, "message" to error.message)
                    )
                    rewardedAd = null
                    preload()
                    onFailed()
                }
            }

            ad.show(activity) {
                appAnalytics.logAction("ad_rewarded_earned")
                onRewarded()
            }
        }

        rewardedAd?.let {
            showReadyAd(it)
            return
        }

        loadRewardedAd(
            onLoaded = { loadedAd -> showReadyAd(loadedAd) },
            onFailed = { onFailed() }
        )
    }

    fun isReady(): Boolean = rewardedAd != null

    private fun loadRewardedAd(
        onLoaded: (RewardedAd) -> Unit,
        onFailed: () -> Unit
    ) {
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(
            context,
            AdConfig.REWARD,
            adRequest,
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    appAnalytics.logAction("ad_rewarded_loaded")
                    rewardedAd = ad
                    onLoaded(ad)
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    appAnalytics.logAction(
                        "ad_rewarded_load_failed",
                        mapOf("code" to error.code, "message" to error.message)
                    )
                    rewardedAd = null
                    onFailed()
                }
            }
        )
    }
}
