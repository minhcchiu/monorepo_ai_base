package com.izisoft.pp09base.features.onboarding.data.repository

import com.izisoft.pp09base.features.onboarding.data.api.OnboardingApi
import com.izisoft.pp09base.features.onboarding.data.model.Onboarding
import com.izisoft.pp09base.features.onboarding.data.model.toDomain
import javax.inject.Inject

class OnboardingRepositoryImpl @Inject constructor(
    private val api: OnboardingApi
) : OnboardingRepository {
    override suspend fun getSteps(): List<Onboarding> {
        try {
            val dtos = api.getOnboardingSteps()
            return dtos.map { it.toDomain() }
        } catch (e: Exception) {
            return listOf(
                Onboarding(id = "1", title = "Khám phá", description = "Khám phá thế giới xung quanh bạn", imageUrl = null),
                Onboarding(id = "2", title = "Phân tích", description = "Phân tích và nhận diện mọi thứ", imageUrl = null),
                Onboarding(id = "3", title = "Lưu trữ", description = "Lưu trữ và quản lý bộ sưu tập", imageUrl = null)
            )
        }
    }
}
