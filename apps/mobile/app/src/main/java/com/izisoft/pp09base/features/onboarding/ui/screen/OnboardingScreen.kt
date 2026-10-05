package com.izisoft.pp09base.features.onboarding.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import com.izisoft.pp09base.R
import com.izisoft.pp09base.features.onboarding.logic.OnboardingViewModel
import com.izisoft.pp09base.features.onboarding.ui.component.OnboardingContent
import com.izisoft.pp09base.features.onboarding.ui.component.OnboardingTopBar

@Composable
fun OnboardingScreen(
    viewModel: OnboardingViewModel,
    onBack: () -> Unit,
    onFinished: () -> Unit
) {
    val state = viewModel.state.collectAsState()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.value.isLoading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            state.value.error != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = state.value.error ?: stringResource(id = R.string.generic_error),
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            else -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    OnboardingTopBar(
                        onBack = onBack,
                        onSkip = {
                            viewModel.onComplete()
                            onFinished()
                        }
                    )
                    OnboardingContent(
                        currentPage = 0,
                        totalPages = 3,
                        title = stringResource(id = R.string.onboarding_title),
                        description = stringResource(id = R.string.onboarding_description),
                        onNext = {
                            viewModel.onComplete()
                            onFinished()
                        },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}
