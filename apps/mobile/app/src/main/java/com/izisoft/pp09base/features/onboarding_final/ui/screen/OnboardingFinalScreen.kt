package com.izisoft.pp09base.features.onboarding_final.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.onboarding_final.ui.component.OnboardingFinalActionSection
import com.izisoft.pp09base.features.onboarding_final.ui.component.OnboardingFinalFooter
import com.izisoft.pp09base.features.onboarding_final.ui.component.OnboardingFinalHeroSection
import com.izisoft.pp09base.features.onboarding_final.ui.component.OnboardingFinalTopBar

data class OnboardingFinalScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val heroImageUrl: String? = null,
    val title: String = "Ready to explore Earth's treasures?",
    val description: String = "Start your mineral journey with AI-powered identification.",
    val ctaText: String = "Start Scanning Now",
    val socialProofText: String = "Join 50,000+ collectors",
    val avatarImageUrls: List<String> = emptyList(),
    val footerText: String = "Geological Precision Guaranteed"
)

@Composable
fun OnboardingFinalScreen(
    uiState: OnboardingFinalScreenUiState,
    onBack: () -> Unit,
    onSkip: () -> Unit,
    onPrimaryAction: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.surface
    ) {
        when {
            uiState.isLoading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

            uiState.error != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = uiState.error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(onClick = onRetry) {
                        Text(text = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.retry))
                    }
                }
            }

            else -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    OnboardingFinalTopBar(
                        onBack = onBack,
                        onSkip = onSkip
                    )
                    Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(horizontal = 20.dp, vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        OnboardingFinalHeroSection(
                            imageUrl = uiState.heroImageUrl,
                            modifier = Modifier.fillMaxWidth(0.92f)
                        )

                        OnboardingFinalActionSection(
                            title = uiState.title,
                            description = uiState.description,
                            ctaText = uiState.ctaText,
                            socialProofText = uiState.socialProofText,
                            avatarImageUrls = uiState.avatarImageUrls,
                            onPrimaryAction = onPrimaryAction,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    OnboardingFinalFooter(text = uiState.footerText)
                }
            }
        }
    }
}
