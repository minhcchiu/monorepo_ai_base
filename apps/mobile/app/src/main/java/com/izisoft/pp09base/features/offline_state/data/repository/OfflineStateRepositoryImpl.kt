package com.izisoft.pp09base.features.offline_state.data.repository

import com.izisoft.pp09base.features.offline_state.data.api.OfflineStateApi
import com.izisoft.pp09base.features.offline_state.data.model.OfflineState
import com.izisoft.pp09base.features.offline_state.data.model.toDomain

class OfflineStateRepositoryImpl(private val api: OfflineStateApi) : OfflineStateRepository {
    override suspend fun get(): OfflineState {
        val dto = api.getState()
        return dto.toDomain()
    }
}
