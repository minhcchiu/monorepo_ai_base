package com.izisoft.pp09base.features.paywall_trigger.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.core.analytics.AnalyticsEvent
import com.izisoft.pp09base.core.analytics.AnalyticsService
import com.izisoft.pp09base.features.paywall_trigger.data.model.Trigger
import com.izisoft.pp09base.features.paywall_trigger.data.repository.PaywallTriggerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaywallTriggerUiState(
    val isLoading: Boolean = false,
    val triggered: Boolean = false,
    val error: String? = null,
    val isPremium: Boolean = false,
    val showRewardedAd: Boolean = false,
    val rewardedAdsWatchedToday: Int = 0,
    val maxRewardedAdsPerDay: Int = 3
)

@HiltViewModel
class PaywallTriggerViewModel @Inject constructor(
    private val repository: PaywallTriggerRepository,
    private val analyticsService: AnalyticsService
) : ViewModel() {
    private val _state = MutableStateFlow(PaywallTriggerUiState())
    val state: StateFlow<PaywallTriggerUiState> = _state

    fun trigger() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val r: Trigger = repository.triggerPaywall()
                analyticsService.logEvent(
                    AnalyticsEvent.PAYWALL_VIEW,
                    mapOf("source" to "paywall_trigger")
                )
                _state.value = PaywallTriggerUiState(
                    triggered = r.triggered,
                    isPremium = repository.isPremium()
                )
            } catch (e: Exception) {
                _state.value = PaywallTriggerUiState(error = e.message ?: "Unknown")
            }
        }
    }

    fun updatePremiumStatus(isPremium: Boolean) {
        _state.value = _state.value.copy(isPremium = isPremium)
    }

    fun showRewardedAd() {
        if (!_state.value.isPremium && _state.value.rewardedAdsWatchedToday < _state.value.maxRewardedAdsPerDay) {
            _state.value = _state.value.copy(showRewardedAd = true)
        }
    }

    fun onRewardedAdCompleted() {
        analyticsService.logEvent(
            AnalyticsEvent.AD_REWARD,
            mapOf("reward_type" to "paywall_unlock", "reward_amount" to 1)
        )
        val newCount = _state.value.rewardedAdsWatchedToday + 1
        _state.value = _state.value.copy(
            showRewardedAd = false,
            rewardedAdsWatchedToday = newCount
        )
    }

    fun onRewardedAdDismissed() {
        _state.value = _state.value.copy(showRewardedAd = false)
    }
}
