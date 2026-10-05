package com.izisoft.pp09base.features.onboarding_final.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.onboarding_final.data.model.OnboardingFinal
import com.izisoft.pp09base.features.onboarding_final.data.repository.OnboardingFinalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OnboardingFinalUiState(
    val isLoading: Boolean = false,
    val data: List<OnboardingFinal> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class OnboardingFinalViewModel @Inject constructor(
    private val repository: OnboardingFinalRepository
) : ViewModel() {
    private val _state = MutableStateFlow(OnboardingFinalUiState())
    val state: StateFlow<OnboardingFinalUiState> = _state

    init { fetchFinalSteps() }

    fun fetchFinalSteps() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val items = repository.getFinalSteps()
                _state.value = OnboardingFinalUiState(data = items)
            } catch (e: Exception) {
                _state.value = OnboardingFinalUiState(error = e.message ?: "Unknown error")
            }
        }
    }

    fun completeOnboarding() {
        // simple local action, no repo call
    }
}
