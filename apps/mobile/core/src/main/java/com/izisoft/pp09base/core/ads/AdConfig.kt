package com.izisoft.pp09base.core.ads

object AdConfig {
    // Test ad unit IDs (Google official test IDs)
    object Test {
        const val BANNER = "ca-app-pub-3940256099942544/6300978111"
        const val INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712"
        const val INTERSTITIAL_REWARD = "ca-app-pub-3940256099942544/5354046379"
        const val NATIVE = "ca-app-pub-3940256099942544/2247696110"
        const val OPEN = "ca-app-pub-3940256099942544/3419835294"
        const val REWARD = "ca-app-pub-3940256099942544/5224354917"
    }

    // Production ad unit IDs
    object Prod {
        const val BANNER = "ca-app-pub-7801106730942036/3164344955"
        const val INTERSTITIAL = "ca-app-pub-7801106730942036/9538181613"
        const val INTERSTITIAL_REWARD = "ca-app-pub-7801106730942036/1831081985"
        const val NATIVE = "ca-app-pub-7801106730942036/9518000319"
        const val OPEN = "ca-app-pub-7801106730942036/4533320840"
        const val REWARD = "ca-app-pub-7801106730942036/4547415678"
    }

    // Toggle: true = use test IDs, false = use production IDs
    private const val USE_TEST_ADS = false

    val BANNER get() = if (USE_TEST_ADS) Test.BANNER else Prod.BANNER
    val INTERSTITIAL get() = if (USE_TEST_ADS) Test.INTERSTITIAL else Prod.INTERSTITIAL
    val INTERSTITIAL_REWARD get() = if (USE_TEST_ADS) Test.INTERSTITIAL_REWARD else Prod.INTERSTITIAL_REWARD
    val NATIVE get() = if (USE_TEST_ADS) Test.NATIVE else Prod.NATIVE
    val OPEN get() = if (USE_TEST_ADS) Test.OPEN else Prod.OPEN
    val REWARD get() = if (USE_TEST_ADS) Test.REWARD else Prod.REWARD
}
