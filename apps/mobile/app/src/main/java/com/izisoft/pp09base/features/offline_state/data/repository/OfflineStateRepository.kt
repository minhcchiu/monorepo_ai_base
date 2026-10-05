package com.izisoft.pp09base.features.offline_state.data.repository

import com.izisoft.pp09base.features.offline_state.data.model.OfflineState

interface OfflineStateRepository {
    suspend fun get(): OfflineState
}
