package com.izisoft.pp09base.features.premium_success.data.repository

import com.izisoft.pp09base.features.premium_success.data.api.PremiumDto
import com.izisoft.pp09base.features.premium_success.data.api.PremiumSuccessApi
import com.izisoft.pp09base.features.premium_success.data.model.Premium
import javax.inject.Inject

class PremiumSuccessRepositoryImpl @Inject constructor(
    private val api: PremiumSuccessApi
) : PremiumSuccessRepository {
    override suspend fun getPremiumInfo(): Premium {
        return try {
            val dto: PremiumDto = api.getSuccess()
            Premium(subscriptionId = dto.subscriptionId, message = dto.message)
        } catch (e: Exception) {
            Premium(subscriptionId = "", message = "")
        }
    }
}
