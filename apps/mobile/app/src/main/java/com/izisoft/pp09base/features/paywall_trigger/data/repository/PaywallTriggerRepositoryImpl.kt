package com.izisoft.pp09base.features.paywall_trigger.data.repository

import com.izisoft.pp09base.features.paywall_trigger.data.api.PaywallTriggerApi
import com.izisoft.pp09base.features.paywall_trigger.data.model.Trigger
import javax.inject.Inject

class PaywallTriggerRepositoryImpl @Inject constructor(
    private val api: PaywallTriggerApi
) : PaywallTriggerRepository {
    override suspend fun triggerPaywall(): Trigger {
        return try {
            val dto = api.trigger()
            Trigger(triggered = dto.triggered)
        } catch (e: Exception) {
            Trigger(triggered = false)
        }
    }

    override fun isPremium(): Boolean = false
}
