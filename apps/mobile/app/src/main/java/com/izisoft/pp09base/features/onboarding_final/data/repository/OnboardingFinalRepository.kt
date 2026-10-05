package com.izisoft.pp09base.features.onboarding_final.data.repository

import com.izisoft.pp09base.features.onboarding_final.data.model.OnboardingFinal

interface OnboardingFinalRepository {
    suspend fun getFinalSteps(): List<OnboardingFinal>
}
