package com.izisoft.pp09base.features.login.data.model

fun LoginResponseDto.toDomain(): LoginResult {
    val auth = data ?: throw IllegalStateException("Login response is missing auth data")
    val user = auth.user ?: throw IllegalStateException("Login response is missing user data")

    return LoginResult(
        accessToken = auth.accessToken.orEmpty(),
        refreshToken = auth.refreshToken.orEmpty(),
        userId = user.id.orEmpty(),
        email = user.email.orEmpty(),
        firstName = user.firstName.orEmpty(),
        lastName = user.lastName.orEmpty(),
        role = user.role.orEmpty()
    )
}
