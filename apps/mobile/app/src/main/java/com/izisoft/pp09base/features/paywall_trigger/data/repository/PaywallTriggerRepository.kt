package com.izisoft.pp09base.features.paywall_trigger.data.repository

import com.izisoft.pp09base.features.paywall_trigger.data.model.Trigger

interface PaywallTriggerRepository {
    suspend fun triggerPaywall(): Trigger
    fun isPremium(): Boolean
}
