package com.izisoft.pp09base.features.onboarding1.data.model

fun Onboarding1Dto.toDomain(): Onboarding1 = Onboarding1(
    id = id,
    title = header,
    description = body,
    imageUrl = image
)
