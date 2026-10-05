package com.izisoft.pp09base.features.welcome.data.model

fun WelcomeDto.toDomain(): Welcome = Welcome(
    title = title,
    subtitle = subtitle,
    imageUrl = heroImage
)
