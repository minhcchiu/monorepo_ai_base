package com.izisoft.pp09base.features.register.data.model

fun RegisterResponseDto.toDomain(): RegisterAccount {
    val auth = data ?: throw IllegalStateException("Register response is missing auth data")
    val user = auth.user ?: throw IllegalStateException("Register response is missing user data")

    return RegisterAccount(
        accessToken = auth.accessToken.orEmpty(),
        refreshToken = auth.refreshToken.orEmpty(),
        userId = user.id.orEmpty(),
        email = user.email.orEmpty(),
        firstName = user.firstName.orEmpty(),
        lastName = user.lastName.orEmpty(),
        role = user.role.orEmpty()
    )
}
