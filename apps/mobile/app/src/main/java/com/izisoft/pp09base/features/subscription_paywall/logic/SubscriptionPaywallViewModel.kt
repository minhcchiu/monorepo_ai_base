package com.izisoft.pp09base.features.subscription_paywall.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionProduct
import com.izisoft.pp09base.features.subscription_paywall.data.repository.SubscriptionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SubscriptionPaywallUiState(
    val isLoading: Boolean = false,
    val products: List<SubscriptionProduct> = emptyList(),
    val purchaseSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class SubscriptionPaywallViewModel @Inject constructor(
    private val repository: SubscriptionRepository
) : ViewModel() {
    private val _state = MutableStateFlow(SubscriptionPaywallUiState())
    val state: StateFlow<SubscriptionPaywallUiState> = _state

    init { loadProducts() }

    fun loadProducts() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val list = repository.getProducts()
                _state.value = _state.value.copy(
                    isLoading = false,
                    products = list,
                    error = null
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Unknown error"
                )
            }
        }
    }

    fun purchase(productId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val ok = repository.purchaseProduct(productId)
                _state.value = _state.value.copy(
                    isLoading = false,
                    purchaseSuccess = ok,
                    error = null
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    purchaseSuccess = false,
                    error = e.message ?: "Unable to complete purchase."
                )
            }
        }
    }

    fun restorePurchases() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val restored = repository.restorePurchases()
                _state.value = _state.value.copy(
                    isLoading = false,
                    purchaseSuccess = restored,
                    error = if (restored) null else "No active subscription found to restore."
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    purchaseSuccess = false,
                    error = e.message ?: "Unable to restore purchases."
                )
            }
        }
    }

    fun consumePurchaseSuccess() {
        _state.value = _state.value.copy(purchaseSuccess = false)
    }
}
