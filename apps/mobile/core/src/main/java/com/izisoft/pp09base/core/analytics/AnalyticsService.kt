package com.izisoft.pp09base.core.analytics

interface AnalyticsService {
    fun logEvent(eventName: String, params: Map<String, Any?> = emptyMap())
}
