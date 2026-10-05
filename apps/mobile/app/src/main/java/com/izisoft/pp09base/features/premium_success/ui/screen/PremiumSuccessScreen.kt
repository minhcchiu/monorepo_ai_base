package com.izisoft.pp09base.features.premium_success.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumFeatureUi
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumOrderSummaryUi
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessErrorView
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessFeatureCard
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessFooter
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessHeader
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessHeroIcon
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessLoadingView
import com.izisoft.pp09base.features.premium_success.ui.component.PremiumSuccessOrderSummary

data class PremiumSuccessScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val brandLabel: String = "Premium",
    val heroTitle: String = "Welcome to Premium!",
    val heroDescription: String = "Your transaction was successful. Enjoy the full premium experience.",
    val unlockedFeatures: List<PremiumFeatureUi> = DefaultPremiumSuccessFeatures,
    val orderSummary: PremiumOrderSummaryUi = DefaultPremiumOrderSummary,
    val ctaText: String = "Back to Result",
    val receiptNote: String = "A receipt has been sent to your registered email."
)

val DefaultPremiumSuccessFeatures = listOf(
    PremiumFeatureUi(
        iconName = "auto_awesome",
        title = "Unlimited Identification",
        subtitle = "Scan minerals without limits."
    ),
    PremiumFeatureUi(
        iconName = "science",
        title = "Chemical Composition",
        subtitle = "Detailed molecular breakdowns."
    ),
    PremiumFeatureUi(
        iconName = "location_on",
        title = "Global Locality Maps",
        subtitle = "Trace sourcing origins worldwide."
    )
)

val DefaultPremiumOrderSummary = PremiumOrderSummaryUi(
    planName = "Annual Collector Pass",
    totalPrice = "\$49.99/yr",
    transactionId = "#RAI-7821-4490"
)

@Composable
fun PremiumSuccessScreen(
    uiState: PremiumSuccessScreenUiState,
    onDoneClick: () -> Unit,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when {
            uiState.isLoading -> {
                PremiumSuccessLoadingView()
            }

            uiState.error != null -> {
                PremiumSuccessErrorView(
                    message = uiState.error,
                    onRetryClick = onRetryClick
                )
            }

            else -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.16f),
                                    MaterialTheme.colorScheme.background
                                )
                            )
                        )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 10.dp, bottom = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            PremiumSuccessHeader(brandLabel = uiState.brandLabel)
                        }

                        PremiumSuccessHeroIcon(
                            modifier = Modifier.padding(top = 0.dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 2.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = uiState.heroTitle,
                                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = uiState.heroDescription,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        PremiumSuccessOrderSummary(
                            order = uiState.orderSummary,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 2.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            uiState.unlockedFeatures.forEach { feature ->
                                PremiumSuccessFeatureCard(feature = feature)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        PremiumSuccessFooter(
                            ctaText = uiState.ctaText,
                            receiptNote = uiState.receiptNote,
                            onCtaClick = onDoneClick,
                            modifier = Modifier.navigationBarsPadding()
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}
