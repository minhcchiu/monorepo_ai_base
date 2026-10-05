package com.izisoft.pp09base.features.onboarding.data.model

fun OnboardingDto.toDomain(): Onboarding = Onboarding(
    id = id,
    title = title,
    description = description,
    imageUrl = imageUrl
)
