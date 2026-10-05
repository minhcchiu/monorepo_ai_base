package com.izisoft.pp09base.features.premium_success.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.premium_success.data.model.Premium
import com.izisoft.pp09base.features.premium_success.data.repository.PremiumSuccessRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PremiumSuccessUiState(
    val isLoading: Boolean = false,
    val premium: Premium? = null,
    val error: String? = null,
    val purchasedPlanName: String? = null,
    val purchasedPrice: String? = null
)

@HiltViewModel
class PremiumSuccessViewModel @Inject constructor(
    private val repository: PremiumSuccessRepository
) : ViewModel() {
    private val _state = MutableStateFlow(PremiumSuccessUiState())
    val state: StateFlow<PremiumSuccessUiState> = _state

    fun setPurchasedPlan(planName: String?, price: String?) {
        _state.value = _state.value.copy(
            purchasedPlanName = planName,
            purchasedPrice = price
        )
    }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val p = repository.getPremiumInfo()
                _state.value = _state.value.copy(
                    isLoading = false,
                    premium = p,
                    error = null
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Unknown"
                )
            }
        }
    }
}
