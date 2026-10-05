package com.izisoft.pp09base.features.onboarding.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.core.analytics.AnalyticsEvent
import com.izisoft.pp09base.core.analytics.AnalyticsService
import com.izisoft.pp09base.features.onboarding.data.model.Onboarding
import com.izisoft.pp09base.features.onboarding.data.repository.OnboardingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OnboardingUiState(
    val isLoading: Boolean = false,
    val data: List<Onboarding> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val repository: OnboardingRepository,
    private val analyticsService: AnalyticsService
) : ViewModel() {
    private val _state = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = _state

    init {
        fetchSteps()
    }

    fun fetchSteps() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val steps = repository.getSteps()
                _state.value = OnboardingUiState(data = steps)
            } catch (e: Exception) {
                _state.value = OnboardingUiState(error = e.message ?: "Unknown error")
            }
        }
    }

    fun onComplete() {
        analyticsService.logEvent(AnalyticsEvent.ONBOARDING_COMPLETE)
    }

    fun onRetry() = fetchSteps()
}
