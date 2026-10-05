package com.izisoft.pp09base.features.register.data.model

data class RegisterAccount(
    val accessToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String
)
