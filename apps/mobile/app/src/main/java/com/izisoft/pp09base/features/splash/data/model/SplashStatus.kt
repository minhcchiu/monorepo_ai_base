package com.izisoft.pp09base.features.splash.data.model

data class GuestSession(
    val userId: String,
    val accessToken: String
)

data class RemoteConfig(
    val maxFreeAction: Int,
    val adsEnabled: Boolean
)

data class AppInitConfig(
    val isFirstInstall: Boolean,
    val isPremium: Boolean,
    val actionRemaining: Int,
    val showPaywall: Boolean,
    val remoteConfig: RemoteConfig
)

data class SplashLaunchResult(
    val userId: String,
    val accessToken: String,
    val initConfig: AppInitConfig,
    val shouldNavigateHome: Boolean,
    val subscriptionStatus: SubscriptionStatus? = null,
    val isPremium: Boolean = false
)
