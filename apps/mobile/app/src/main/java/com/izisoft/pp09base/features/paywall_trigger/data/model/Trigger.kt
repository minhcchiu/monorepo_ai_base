package com.izisoft.pp09base.features.paywall_trigger.data.model

import com.izisoft.pp09base.features.paywall_trigger.data.api.TriggerDto

data class Trigger(val triggered: Boolean)

fun TriggerDto.toDomain(): Trigger = Trigger(triggered = triggered)

// Note: keep DTO in api package
