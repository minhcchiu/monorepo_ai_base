package com.izisoft.pp09base.features.login.data.model

data class LoginResult(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String
)
