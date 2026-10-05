package com.izisoft.pp09base.features.onboarding.data.repository

import com.izisoft.pp09base.features.onboarding.data.model.Onboarding

interface OnboardingRepository {
    suspend fun getSteps(): List<Onboarding>
}
