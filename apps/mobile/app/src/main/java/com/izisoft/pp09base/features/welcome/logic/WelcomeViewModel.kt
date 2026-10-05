package com.izisoft.pp09base.features.welcome.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.welcome.data.model.Welcome
import com.izisoft.pp09base.features.welcome.data.repository.WelcomeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WelcomeUiState(
    val isLoading: Boolean = false,
    val welcome: Welcome? = null,
    val error: String? = null
)

@HiltViewModel
class WelcomeViewModel @Inject constructor(
    private val repository: WelcomeRepository
) : ViewModel() {
    private val _state = MutableStateFlow(WelcomeUiState())
    val state: StateFlow<WelcomeUiState> = _state

    init { loadWelcome() }

    fun loadWelcome() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val w = repository.getWelcome()
                _state.value = WelcomeUiState(welcome = w)
            } catch (e: Exception) {
                _state.value = WelcomeUiState(error = e.message ?: "Unknown error")
            }
        }
    }
}
