package com.izisoft.pp09base.features.onboarding1.data.repository

import com.izisoft.pp09base.features.onboarding1.data.api.Onboarding1Api
import com.izisoft.pp09base.features.onboarding1.data.model.Onboarding1
import com.izisoft.pp09base.features.onboarding1.data.model.toDomain
import javax.inject.Inject

class Onboarding1RepositoryImpl @Inject constructor(
    private val api: Onboarding1Api
) : Onboarding1Repository {
    override suspend fun getSteps(): List<Onboarding1> {
        try {
            val dtos = api.getOnboardingSteps()
            return dtos.map { it.toDomain() }
        } catch (e: Exception) {
            return listOf(
                Onboarding1(id = "1", title = "Bước 1", description = "Chụp ảnh vật thể bạn muốn nhận diện", imageUrl = null),
                Onboarding1(id = "2", title = "Bước 2", description = "AI sẽ phân tích và trả kết quả", imageUrl = null),
                Onboarding1(id = "3", title = "Bước 3", description = "Lưu và chia sẻ kết quả", imageUrl = null)
            )
        }
    }
}
