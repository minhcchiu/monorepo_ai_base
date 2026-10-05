package com.izisoft.pp09base.features.login.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.login.data.repository.LoginRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false,
    val welcomeMessage: String = ""
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginRepository: LoginRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    fun onEmailChange(value: String) {
        _state.value = _state.value.copy(email = value, error = null)
    }

    fun onPasswordChange(value: String) {
        _state.value = _state.value.copy(password = value, error = null)
    }

    fun login() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, isSuccess = false)
            try {
                val result = loginRepository.login(_state.value.email, _state.value.password)
                val displayName = listOf(result.firstName, result.lastName)
                    .filter { it.isNotBlank() }
                    .joinToString(" ")
                    .ifBlank { result.email }
                _state.value = _state.value.copy(
                    isLoading = false,
                    isSuccess = true,
                    welcomeMessage = "Welcome, $displayName"
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    isSuccess = false,
                    error = exception.message ?: "Login failed"
                )
            }
        }
    }

    fun clearSuccess() {
        _state.value = _state.value.copy(isSuccess = false)
    }
}
