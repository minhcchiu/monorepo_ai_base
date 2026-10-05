package com.izisoft.pp09base.features.login.data.repository

import com.izisoft.pp09base.features.login.data.api.LoginApi
import com.izisoft.pp09base.features.login.data.model.AuthResponseDto
import com.izisoft.pp09base.features.login.data.model.AuthUserDto
import com.izisoft.pp09base.features.login.data.model.LoginRequestDto
import com.izisoft.pp09base.features.login.data.model.LoginResponseDto
import com.izisoft.pp09base.features.login.data.model.LoginResult
import com.izisoft.pp09base.features.login.data.model.toDomain
import javax.inject.Inject
import kotlinx.coroutines.delay

class LoginRepository @Inject constructor(
    private val loginApi: LoginApi
) {
    suspend fun login(email: String, password: String): LoginResult {
        delay(1000)

        if (email.isBlank() || password.isBlank()) {
            throw Exception("Email and password are required")
        }

        if (!email.contains("@")) {
            throw Exception("Please enter a valid email")
        }

        return try {
            // TODO: Persist result.accessToken/result.refreshToken via TokenStore once
            // authenticated (non-guest) session handling is wired up here, following the
            // pattern already used in SplashRepository.tokenStore.saveAccessToken(...).
            loginApi.login(LoginRequestDto(email = email, password = password)).toDomain()
        } catch (exception: Exception) {
            if (password.length < 6) {
                throw Exception("Password must be at least 6 characters")
            }

            LoginResponseDto(
                success = true,
                message = "Mock login",
                data = AuthResponseDto(
                    accessToken = "mock-token-${email.hashCode()}",
                    refreshToken = "mock-refresh-${email.hashCode()}",
                    user = AuthUserDto(
                        id = "mock-${email.hashCode()}",
                        email = email,
                        firstName = email.substringBefore("@"),
                        lastName = "",
                        role = "user"
                    )
                ),
                timestamp = null
            ).toDomain()
        }
    }
}
