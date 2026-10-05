package com.izisoft.pp09base.core.ads

import com.google.android.gms.ads.nativead.NativeAd
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@EntryPoint
@InstallIn(SingletonComponent::class)
interface AdsEntryPoint {
    fun rewardedAdManager(): RewardedAdManager
    fun interstitialAdManager(): InterstitialAdManager
    fun premiumStatusManager(): PremiumStatusManager
}
