package com.izisoft.pp09base.features.onboarding1.data.api

import com.izisoft.pp09base.features.onboarding1.data.model.Onboarding1Dto
import retrofit2.http.GET

interface Onboarding1Api {
    @GET("/onboarding1/steps") // TODO: replace with real endpoint
    suspend fun getOnboardingSteps(): List<Onboarding1Dto>
}
