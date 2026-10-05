package com.izisoft.pp09base.features.splash.data.model

fun GuestLoginResponseDto.toDomain(): GuestSession {
    return GuestSession(
        userId = data.user.id,
        accessToken = data.accessToken
    )
}

fun AppInitResponseDto.toDomain(): AppInitConfig {
    return AppInitConfig(
        isFirstInstall = data.isFirstInstall,
        isPremium = data.isPremium,
        actionRemaining = data.actionRemaining,
        showPaywall = data.showPaywall,
        remoteConfig = RemoteConfig(
            maxFreeAction = data.remoteConfig.maxFreeAction,
            adsEnabled = data.remoteConfig.adsEnabled
        )
    )
}

fun SubscriptionStatusResponseDto.toDomain(): SubscriptionStatus {
    val payload = data
    return SubscriptionStatus(
        isPremium = payload?.isPremium ?: payload?.isPremiumAlt ?: false,
        plan = payload?.plan.orEmpty(),
        isTrial = payload?.isTrial ?: false,
        expiresAt = payload?.expiresAt.orEmpty(),
        autoRenew = payload?.autoRenew ?: false,
        status = payload?.status.orEmpty()
    )
}
