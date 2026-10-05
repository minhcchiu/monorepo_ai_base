package com.izisoft.pp09base.features.offline_state.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.offline_state.data.model.OfflineState
import com.izisoft.pp09base.features.offline_state.data.repository.OfflineStateRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OfflineStateUiState(
    val isLoading: Boolean = false,
    val state: OfflineState? = null,
    val error: String? = null
)

@HiltViewModel
class OfflineStateViewModel @Inject constructor(private val repository: OfflineStateRepository) : ViewModel() {
    private val _state = MutableStateFlow(OfflineStateUiState())
    val state: StateFlow<OfflineStateUiState> = _state

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val s = repository.get()
                _state.value = OfflineStateUiState(state = s)
            } catch (e: Exception) {
                _state.value = OfflineStateUiState(error = e.message ?: "Unknown")
            }
        }
    }
}
