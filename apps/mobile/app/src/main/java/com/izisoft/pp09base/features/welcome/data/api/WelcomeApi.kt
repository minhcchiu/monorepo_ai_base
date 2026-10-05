package com.izisoft.pp09base.features.welcome.data.api

import com.izisoft.pp09base.features.welcome.data.model.WelcomeDto
import retrofit2.http.GET

interface WelcomeApi {
    @GET("/welcome") // TODO: replace with real endpoint
    suspend fun getWelcome(): WelcomeDto
}
