package com.izisoft.pp09base.features.profile_subscription.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.profile_subscription.data.model.Subscription
import com.izisoft.pp09base.features.profile_subscription.data.repository.ProfileSubscriptionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileSubscriptionUiState(
    val isLoading: Boolean = false,
    val subscription: Subscription? = null,
    val error: String? = null
)

@HiltViewModel
class ProfileSubscriptionViewModel @Inject constructor(private val repository: ProfileSubscriptionRepository) : ViewModel() {
    private val _state = MutableStateFlow(ProfileSubscriptionUiState())
    val state: StateFlow<ProfileSubscriptionUiState> = _state

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val s = repository.get()
                _state.value = ProfileSubscriptionUiState(subscription = s)
            } catch (e: Exception) {
                _state.value = ProfileSubscriptionUiState(error = e.message ?: "Unknown")
            }
        }
    }
}
