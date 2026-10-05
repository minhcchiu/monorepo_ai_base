package com.izisoft.pp09base.features.register.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.register.data.repository.RegisterRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RegisterUiState(
    val fullName: String = "",
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false,
    val successMessage: String = ""
)

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val registerRepository: RegisterRepository
) : ViewModel() {

    private val _state = MutableStateFlow(RegisterUiState())
    val state: StateFlow<RegisterUiState> = _state.asStateFlow()

    fun onFullNameChange(value: String) {
        _state.value = _state.value.copy(fullName = value, error = null)
    }

    fun onEmailChange(value: String) {
        _state.value = _state.value.copy(email = value, error = null)
    }

    fun onPasswordChange(value: String) {
        _state.value = _state.value.copy(password = value, error = null)
    }

    fun register() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, isSuccess = false)
            try {
                val account = registerRepository.register(
                    fullName = _state.value.fullName,
                    email = _state.value.email,
                    password = _state.value.password
                )
                val displayName = listOf(account.firstName, account.lastName)
                    .filter { it.isNotBlank() }
                    .joinToString(" ")
                    .ifBlank { account.email }
                _state.value = _state.value.copy(
                    isLoading = false,
                    isSuccess = true,
                    successMessage = "Account created for $displayName"
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    isSuccess = false,
                    error = exception.message ?: "Registration failed"
                )
            }
        }
    }

    fun dismissSuccess() {
        _state.value = _state.value.copy(isSuccess = false)
    }
}
