package com.izisoft.pp09base.features.permission_request.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.features.permission_request.data.model.Permission
import com.izisoft.pp09base.features.permission_request.data.repository.PermissionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PermissionRequestUiState(
    val isLoading: Boolean = false,
    val permission: Permission? = null,
    val error: String? = null,
    val shouldRequestCameraPermission: Boolean = false,
    val shouldRequestNotificationPermission: Boolean = false,
    val isPermissionGranted: Boolean = false
)

@HiltViewModel
class PermissionRequestViewModel @Inject constructor(
    private val repository: PermissionRepository
) : ViewModel() {
    private val _state = MutableStateFlow(PermissionRequestUiState())
    val state: StateFlow<PermissionRequestUiState> = _state

    init { loadRationale() }

    fun loadRationale() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val p = repository.getPermissionRationale()
                _state.value = PermissionRequestUiState(permission = p)
            } catch (e: Exception) {
                _state.value = PermissionRequestUiState(error = e.message ?: "Unknown error")
            }
        }
    }

    fun onRequestPermission() {
        _state.value = _state.value.copy(
            error = null,
            shouldRequestCameraPermission = true
        )
    }

    fun onCameraPermissionRequestConsumed() {
        _state.value = _state.value.copy(shouldRequestCameraPermission = false)
    }

    fun onCameraPermissionResult(isGranted: Boolean) {
        _state.value = _state.value.copy(
            isPermissionGranted = isGranted,
            shouldRequestNotificationPermission = true,
            error = if (isGranted) null else "Camera permission is required to continue."
        )
    }

    fun onNotificationPermissionRequestConsumed() {
        _state.value = _state.value.copy(shouldRequestNotificationPermission = false)
    }

    fun onNotificationPermissionResult(isGranted: Boolean) {
        if (!isGranted && _state.value.error == null) {
            _state.value = _state.value.copy(error = "Notification permission denied.")
        }
    }
}
