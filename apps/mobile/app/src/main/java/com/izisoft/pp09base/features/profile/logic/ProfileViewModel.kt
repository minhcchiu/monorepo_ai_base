package com.izisoft.pp09base.features.profile.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.profile.data.model.Profile
import com.izisoft.pp09base.features.profile.data.repository.ProfileRepository
import com.izisoft.pp09base.core.network.TokenStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject


data class ProfileUiState(
    val isLoading: Boolean = false,
    val profile: Profile? = null,
    val error: String? = null,
    val selectedLanguageCode: String = "EN",
    val isUpdatingSettings: Boolean = false,
    val settingsUpdateError: String? = null,
    val settingsUpdateSuccess: Boolean = false
)
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
    private val tokenStore: TokenStore
) : ViewModel() {
    private val _state = MutableStateFlow(
        ProfileUiState(selectedLanguageCode = tokenStore.getSelectedLanguageCode() ?: "EN")
    )
    val state: StateFlow<ProfileUiState> = _state

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val p = repository.me()
                _state.value = _state.value.copy(
                    isLoading = false,
                    profile = p,
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

    fun logout() {
        viewModelScope.launch {
            repository.logout()
        }
    }

    fun updateSettings(language: String?, unit: String?, notifications: Boolean?) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isUpdatingSettings = true, settingsUpdateError = null, settingsUpdateSuccess = false)
            try {
                repository.updateSettings(language, unit, notifications)
                if (!language.isNullOrBlank()) {
                    tokenStore.saveSelectedLanguageCode(language)
                }
                _state.value = _state.value.copy(
                    isUpdatingSettings = false,
                    settingsUpdateSuccess = true,
                    selectedLanguageCode = language ?: _state.value.selectedLanguageCode
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isUpdatingSettings = false, settingsUpdateError = e.message ?: "Unknown error")
            }
        }
    }

    fun updateLanguage(languageCode: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                selectedLanguageCode = languageCode,
                isUpdatingSettings = true,
                settingsUpdateError = null,
                settingsUpdateSuccess = false
            )

            try {
                repository.updateSettings(language = languageCode, unit = null, notifications = null)
                tokenStore.saveSelectedLanguageCode(languageCode)
                _state.value = _state.value.copy(
                    isUpdatingSettings = false,
                    settingsUpdateSuccess = true
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isUpdatingSettings = false,
                    settingsUpdateError = e.message ?: "Unknown error"
                )
            }
        }
    }

    fun clearSettingsMessage() {
        _state.value = _state.value.copy(settingsUpdateError = null, settingsUpdateSuccess = false)
    }
}
