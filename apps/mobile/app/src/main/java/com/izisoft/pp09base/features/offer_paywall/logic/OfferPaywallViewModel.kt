package com.izisoft.pp09base.features.offer_paywall.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.core.analytics.AnalyticsEvent
import com.izisoft.pp09base.core.analytics.AnalyticsService
import com.izisoft.pp09base.features.offer_paywall.data.repository.OfferPaywallRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OfferPaywallUiState(
    val isLoading: Boolean = false,
    val isPurchasing: Boolean = false,
    val purchaseSuccess: Boolean = false,
    val restoreSuccess: Boolean = false,
    val error: String? = null,
    val offerPrice: String = "",
    val offerTrialInfo: String? = null
)

@HiltViewModel
class OfferPaywallViewModel @Inject constructor(
    private val repository: OfferPaywallRepository,
    private val analyticsService: AnalyticsService
) : ViewModel() {

    private val _state = MutableStateFlow(OfferPaywallUiState(isLoading = true))
    val state: StateFlow<OfferPaywallUiState> = _state.asStateFlow()

    init {
        loadOffer()
    }

    fun loadOffer() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val (price, trialInfo) = repository.getOfferProductDetails()
                _state.value = _state.value.copy(
                    isLoading = false,
                    purchaseSuccess = false,
                    restoreSuccess = false,
                    error = null,
                    offerPrice = price,
                    offerTrialInfo = trialInfo
                )
                analyticsService.logEvent(
                    AnalyticsEvent.PAYWALL_VIEW,
                    mapOf("source" to "offer_paywall", "plan_type" to "subscription")
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = exception.message ?: "Unable to load offer."
                )
            }
        }
    }

    fun purchaseSelectedPlan() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isPurchasing = true, error = null)
            try {
                val success = repository.purchaseOffer("sub_yearly_offer")
                if (success) {
                    analyticsService.logEvent(
                        AnalyticsEvent.TRIAL_STARTED,
                        mapOf(
                            "product_id" to "sub_yearly_offer",
                            "plan_type" to "subscription"
                        )
                    )
                }
                _state.value = _state.value.copy(
                    isPurchasing = false,
                    purchaseSuccess = success,
                    error = null
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isPurchasing = false,
                    purchaseSuccess = false,
                    error = exception.message ?: "Unable to complete purchase."
                )
            }
        }
    }

    fun restorePurchases() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isPurchasing = true, error = null)
            try {
                val restored = repository.restorePurchases()
                _state.value = _state.value.copy(
                    isPurchasing = false,
                    restoreSuccess = restored,
                    error = if (restored) null else "No active purchase found."
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isPurchasing = false,
                    restoreSuccess = false,
                    error = exception.message ?: "Unable to restore purchases."
                )
            }
        }
    }

    fun consumeEvents() {
        _state.value = _state.value.copy(
            purchaseSuccess = false,
            restoreSuccess = false,
            error = null
        )
    }
}
