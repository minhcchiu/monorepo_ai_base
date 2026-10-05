package com.izisoft.pp09base.features.onboarding1.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.onboarding1.data.model.Onboarding1
import com.izisoft.pp09base.features.onboarding1.data.repository.Onboarding1Repository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class Onboarding1UiState(
    val isLoading: Boolean = false,
    val data: List<Onboarding1> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class Onboarding1ViewModel @Inject constructor(
    private val repository: Onboarding1Repository
) : ViewModel() {
    private val _state = MutableStateFlow(Onboarding1UiState())
    val state: StateFlow<Onboarding1UiState> = _state

    init { fetchSteps() }

    fun fetchSteps() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val steps = repository.getSteps()
                _state.value = Onboarding1UiState(data = steps)
            } catch (e: Exception) {
                _state.value = Onboarding1UiState(error = e.message ?: "Unknown error")
            }
        }
    }

    fun onRetry() = fetchSteps()
}
