package com.izisoft.pp09base.features.splash.logic

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.izisoft.pp09base.core.analytics.AnalyticsEvent
import com.izisoft.pp09base.core.analytics.AnalyticsPrefs
import com.izisoft.pp09base.core.analytics.AnalyticsService
import com.izisoft.pp09base.features.splash.data.model.SplashLaunchResult
import com.izisoft.pp09base.features.splash.data.repository.SplashRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SplashUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val navigateTo: String? = null,
    val statusMessage: String = "Starting app...",
    val result: SplashLaunchResult? = null
)

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val splashRepository: SplashRepository,
    private val analyticsService: AnalyticsService,
    private val analyticsPrefs: AnalyticsPrefs
) : ViewModel() {

    private val _state = MutableStateFlow(SplashUiState())
    val state: StateFlow<SplashUiState> = _state.asStateFlow()

    init {
        initializeApp()
    }

    fun initializeApp() {
        viewModelScope.launch {
            _state.value = SplashUiState(
                isLoading = true,
                error = null,
                navigateTo = null,
                statusMessage = "Creating guest session...",
                result = null
            )

            try {
                val launchResult = splashRepository.initializeSplash()
                trackFirstOpenAndRetention()
                _state.value = SplashUiState(
                    isLoading = false,
                    error = null,
                    navigateTo = if (launchResult.shouldNavigateHome) "home" else "onboarding",
                    statusMessage = "App initialized",
                    result = launchResult
                )
            } catch (exception: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = exception.message ?: "Unable to initialize app.",
                    navigateTo = null,
                    statusMessage = "Initialization failed"
                )
            }
        }
    }

    fun onNavigationHandled() {
        _state.value = _state.value.copy(navigateTo = null)
    }

    private fun trackFirstOpenAndRetention() {
        val now = System.currentTimeMillis()
        if (!analyticsPrefs.hasLoggedFirstOpen()) {
            analyticsService.logEvent(AnalyticsEvent.FIRST_OPEN)
            analyticsPrefs.setFirstOpenLogged(now)
        } else if (!analyticsPrefs.hasLoggedRetentionD1()) {
            val firstOpenTime = analyticsPrefs.getFirstOpenTimestamp()
            val oneDayMillis = 24 * 60 * 60 * 1000L
            if (now - firstOpenTime >= oneDayMillis) {
                analyticsService.logEvent(AnalyticsEvent.RETENTION_D1)
                analyticsPrefs.setRetentionD1Logged()
            }
        }
    }
}
