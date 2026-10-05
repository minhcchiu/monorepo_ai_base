package com.izisoft.pp09base.features.onboarding_final.data.model

fun OnboardingFinalDto.toDomain(): OnboardingFinal = OnboardingFinal(
    id = id,
    title = heading,
    description = details,
    imageUrl = image
)
