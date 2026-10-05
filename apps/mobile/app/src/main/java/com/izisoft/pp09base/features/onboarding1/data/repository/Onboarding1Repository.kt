package com.izisoft.pp09base.features.onboarding1.data.repository

import com.izisoft.pp09base.features.onboarding1.data.model.Onboarding1

interface Onboarding1Repository {
    suspend fun getSteps(): List<Onboarding1>
}
