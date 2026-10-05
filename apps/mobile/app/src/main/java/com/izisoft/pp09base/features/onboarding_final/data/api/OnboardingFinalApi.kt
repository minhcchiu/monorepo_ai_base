package com.izisoft.pp09base.features.onboarding_final.data.api

import com.izisoft.pp09base.features.onboarding_final.data.model.OnboardingFinalDto
import retrofit2.http.GET

interface OnboardingFinalApi {
    @GET("/onboarding/final/steps") // TODO: replace with real endpoint
    suspend fun getFinalSteps(): List<OnboardingFinalDto>
}
