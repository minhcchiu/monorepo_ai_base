package com.izisoft.pp09base.features.subscription_paywall.data.model

fun SubscriptionProductDto.toDomain(): SubscriptionProduct = SubscriptionProduct(
    id = id,
    name = name,
    price = price,
    description = description
)
