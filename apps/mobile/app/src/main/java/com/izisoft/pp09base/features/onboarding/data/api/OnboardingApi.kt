package com.izisoft.pp09base.features.onboarding.data.api

import com.izisoft.pp09base.features.onboarding.data.model.OnboardingDto
import retrofit2.http.GET

interface OnboardingApi {
    @GET("/onboarding/steps") // TODO: replace with real endpoint
    suspend fun getOnboardingSteps(): List<OnboardingDto>
}
