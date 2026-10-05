package com.izisoft.pp09base.features.onboarding_final.data.repository

import com.izisoft.pp09base.features.onboarding_final.data.api.OnboardingFinalApi
import com.izisoft.pp09base.features.onboarding_final.data.model.OnboardingFinal
import com.izisoft.pp09base.features.onboarding_final.data.model.toDomain
import javax.inject.Inject

class OnboardingFinalRepositoryImpl @Inject constructor(
    private val api: OnboardingFinalApi
) : OnboardingFinalRepository {
    override suspend fun getFinalSteps(): List<OnboardingFinal> {
        try {
            val dtos = api.getFinalSteps()
            return dtos.map { it.toDomain() }
        } catch (e: Exception) {
            return listOf(
                OnboardingFinal(id = "1", title = "Sẵn sàng!", description = "Bạn đã sẵn sàng khám phá ứng dụng", imageUrl = null)
            )
        }
    }
}
