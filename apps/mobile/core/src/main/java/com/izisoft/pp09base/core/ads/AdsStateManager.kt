package com.izisoft.pp09base.core.ads

import dagger.hilt.android.scopes.ViewModelScoped
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@ViewModelScoped
class AdsStateManager @Inject constructor() {
    private val _isPremium = MutableStateFlow(false)
    val isPremium: StateFlow<Boolean> = _isPremium

    fun updatePremiumStatus(isPremium: Boolean) {
        _isPremium.value = isPremium
    }
}
