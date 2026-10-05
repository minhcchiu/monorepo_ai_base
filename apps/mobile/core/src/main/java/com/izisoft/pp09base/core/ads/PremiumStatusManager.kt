package com.izisoft.pp09base.core.ads

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PremiumStatusManager @Inject constructor() {
    private val _isPremium = MutableStateFlow(false)

    val isPremium: StateFlow<Boolean> = _isPremium

    fun isPremium(): Boolean = _isPremium.value

    fun setPremiumStatus(isPremium: Boolean) {
        _isPremium.value = isPremium
    }
}
