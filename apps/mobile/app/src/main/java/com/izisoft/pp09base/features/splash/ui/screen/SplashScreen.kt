package com.izisoft.pp09base.features.splash.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.splash.logic.SplashViewModel
import com.izisoft.pp09base.features.splash.ui.component.SplashBottomProgress
import com.izisoft.pp09base.features.splash.ui.component.SplashLogoSection
import com.izisoft.pp09base.features.splash.ui.component.SplashTopBar

@Composable
fun SplashScreen(
    viewModel: SplashViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.navigateTo) {
        state.navigateTo?.let {
            onNavigate(it)
            viewModel.onNavigationHandled()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
    ) {

        // Top thin progress bar (fixed at top)
        SplashTopBar(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .align(Alignment.TopStart)
        )

        // Center logo + brand
        SplashLogoSection(
            modifier = Modifier.align(Alignment.Center)
        )

        // Bottom progress indicator + status label
        SplashBottomProgress(
            progress = if (state.isLoading) 0.45f else 1f,
            statusText = state.error ?: state.statusMessage,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp)
                .padding(horizontal = 16.dp)
        )

        if (state.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center)
            )
        }

        state.error?.let { error ->
            Text(
                text = error,
                color = Color(0xFFB3261E),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 48.dp)
            )
        }
    }
}
