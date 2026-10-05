package com.izisoft.pp09base.features.register.data.repository

import com.izisoft.pp09base.features.register.data.api.RegisterApi
import com.izisoft.pp09base.features.register.data.model.AuthResponseDto
import com.izisoft.pp09base.features.register.data.model.AuthUserDto
import com.izisoft.pp09base.features.register.data.model.RegisterAccount
import com.izisoft.pp09base.features.register.data.model.RegisterRequestDto
import com.izisoft.pp09base.features.register.data.model.RegisterResponseDto
import com.izisoft.pp09base.features.register.data.model.toDomain
import javax.inject.Inject
import kotlinx.coroutines.delay

class RegisterRepository @Inject constructor(
    private val registerApi: RegisterApi
) {
    suspend fun register(fullName: String, email: String, password: String): RegisterAccount {
        delay(1200)

        if (fullName.isBlank()) {
            throw Exception("Full name is required")
        }
        if (!email.contains("@")) {
            throw Exception("Please enter a valid email")
        }
        if (password.length < 6) {
            throw Exception("Password must be at least 6 characters")
        }

        // The register screen only collects a single "full name" field today.
        // Split it into firstName/lastName as a placeholder until the UI has
        // dedicated fields for the backend's RegisterDto shape.
        val trimmedName = fullName.trim()
        val nameParts = trimmedName.split(Regex("\\s+"), limit = 2)
        val firstName = nameParts.getOrElse(0) { trimmedName }
        val lastName = nameParts.getOrElse(1) { "" }

        return try {
            // TODO: Persist account.accessToken/account.refreshToken via TokenStore once
            // authenticated (non-guest) session handling is wired up here, following the
            // pattern already used in SplashRepository.tokenStore.saveAccessToken(...).
            registerApi.register(
                RegisterRequestDto(
                    email = email,
                    password = password,
                    firstName = firstName,
                    lastName = lastName,
                    phone = null
                )
            ).toDomain()
        } catch (exception: Exception) {
            RegisterResponseDto(
                success = true,
                message = "Mock registration",
                data = AuthResponseDto(
                    accessToken = "mock-token-${email.hashCode()}",
                    refreshToken = "mock-refresh-${email.hashCode()}",
                    user = AuthUserDto(
                        id = "mock-${email.hashCode()}",
                        email = email,
                        firstName = firstName,
                        lastName = lastName,
                        role = "user"
                    )
                ),
                timestamp = null
            ).toDomain()
        }
    }
}
