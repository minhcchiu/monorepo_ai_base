package com.izisoft.pp09base.core.analytics

import com.izisoft.pp09base.core.firebase.AppAnalytics
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseAnalyticsService @Inject constructor(
    private val appAnalytics: AppAnalytics
) : AnalyticsService {
    override fun logEvent(eventName: String, params: Map<String, Any?>) {
        appAnalytics.logAction(eventName, params)
    }
}
