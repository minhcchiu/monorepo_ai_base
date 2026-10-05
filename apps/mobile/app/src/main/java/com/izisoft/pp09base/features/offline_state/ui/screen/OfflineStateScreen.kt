package com.izisoft.pp09base.features.offline_state.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.offline_state.ui.component.OfflineStateActionButtons
import com.izisoft.pp09base.features.offline_state.ui.component.OfflineStateHeroIllustration
import com.izisoft.pp09base.features.offline_state.ui.component.OfflineStateInfoRow
import com.izisoft.pp09base.features.offline_state.ui.component.OfflineStateWatermark

@Composable
fun OfflineStateScreen(
    uiState: OfflineStateScreenUiState,
    onTryAgainClick: () -> Unit,
    onCheckSettingsClick: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.surface
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }

                uiState.error != null -> {
                    Column(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(horizontal = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = uiState.error,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.error,
                            textAlign = TextAlign.Center
                        )
                        androidx.compose.material3.Button(onClick = onRetry) {
                            Text(text = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.retry))
                        }
                    }
                }

                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp)
                            .padding(bottom = 64.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        OfflineStateHeroIllustration(
                            imageUrl = uiState.heroImageUrl
                        )

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = uiState.title,
                                style = MaterialTheme.typography.headlineLarge,
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = uiState.description,
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth(0.9f)
                            )
                        }

                        OfflineStateActionButtons(
                            primaryText = uiState.tryAgainText,
                            secondaryText = uiState.checkSettingsText,
                            onPrimaryClick = onTryAgainClick,
                            onSecondaryClick = onCheckSettingsClick,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 48.dp)
                        )

                        OfflineStateInfoRow(
                            text = uiState.errorCodeText,
                            modifier = Modifier.padding(top = 32.dp)
                        )
                    }
                }
            }

            OfflineStateWatermark(
                text = uiState.watermarkText,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp)
            )
        }
    }
}

data class OfflineStateScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val heroImageUrl: String = "https://lh3.googleusercontent.com/aida-public/AB6AXuAR9GgJtww7hcuGBx_s10zjzCF99V3g9Khw5cD8uTrlZ47iCIs2SAC9glvtXMRTrn2u0X_Lz386jRImC4f9bdPDE2VpOHNxLhHQpIJdDodKR1nS1ZLpZLkul74KEBSIELPjkaAxsn5SVLwpwM_mmlLcWclpt1WTHcXyuHDgk04sNzXh8SGS3K3Usr4DyjXMgEtXQuqtCm-LrIWGSpsE_DPr3CiKXN8kEUXLPsg8S9uUuv1UGDKfxsQvi-7FnzMezPUEVX-sGF5onAU",
    val title: String = "No Internet Connection",
    val description: String = "This app needs a server connection to sync your data.",
    val tryAgainText: String = "Try Again",
    val checkSettingsText: String = "Check Settings",
    val errorCodeText: String = "Error Code: ERR_CONNECTION_LOST",
    val watermarkText: String = "PP09 BASE"
)
