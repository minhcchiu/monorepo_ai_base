package com.izisoft.pp09base.features.offline_state.data.model

data class OfflineStateDto(
    val hasData: Boolean,
    val lastSyncedAt: String?
)
