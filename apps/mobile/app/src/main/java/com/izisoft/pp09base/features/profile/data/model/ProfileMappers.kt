package com.izisoft.pp09base.features.profile.data.model

fun ProfileResponseDto.toDomain(): Profile {
    val payload = data
    val displayName = listOfNotNull(payload?.firstName, payload?.lastName)
        .filter { it.isNotBlank() }
        .joinToString(" ")
    return Profile(
        id = payload?.id.orEmpty(),
        name = displayName,
        email = payload?.email.orEmpty(),
        avatarUrl = payload?.avatarUrl
    )
}
