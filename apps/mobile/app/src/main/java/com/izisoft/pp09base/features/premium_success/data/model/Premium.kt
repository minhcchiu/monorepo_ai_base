package com.izisoft.pp09base.features.premium_success.data.model

import com.izisoft.pp09base.features.premium_success.data.api.PremiumDto

data class Premium(val subscriptionId: String, val message: String?)

fun PremiumDto.toDomain(): Premium = Premium(subscriptionId = subscriptionId, message = message)
