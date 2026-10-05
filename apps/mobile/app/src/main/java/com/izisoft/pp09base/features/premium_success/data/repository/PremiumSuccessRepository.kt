package com.izisoft.pp09base.features.premium_success.data.repository

import com.izisoft.pp09base.features.premium_success.data.model.Premium

interface PremiumSuccessRepository {
    suspend fun getPremiumInfo(): Premium
}
