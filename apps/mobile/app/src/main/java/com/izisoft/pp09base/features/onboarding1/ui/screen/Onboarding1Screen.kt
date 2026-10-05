package com.izisoft.pp09base.features.onboarding1.ui.screen

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
import com.izisoft.pp09base.features.onboarding1.logic.Onboarding1ViewModel
import com.izisoft.pp09base.features.onboarding1.ui.component.Onboarding1Content
import com.izisoft.pp09base.features.onboarding1.ui.component.Onboarding1TopBar

@Composable
fun Onboarding1Screen(
    viewModel: Onboarding1ViewModel,
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
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = state.value.error ?: androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.generic_error), color = MaterialTheme.colorScheme.error)
                }
            }
            else -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    Onboarding1TopBar(
                        onBack = onBack,
                        onSkip = onFinished
                    )
                    Onboarding1Content(
                        currentPage = 1,
                        totalPages = 3,
                        title = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.onboarding1_title),
                        description = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.onboarding1_description),
                        onNext = onFinished,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}
