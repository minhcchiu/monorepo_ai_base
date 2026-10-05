package com.izisoft.pp09base.features.offline_state.data.model

fun OfflineStateDto.toDomain(): OfflineState = OfflineState(hasData = hasData, lastSyncedAt = lastSyncedAt)
