package com.izisoft.pp09base.features.offer_paywall.ui.screen

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
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferBenefitItemUi
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferCountdownCard
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferDealCard
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferPaywallHeroSection
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferPaywallTopBar
import com.izisoft.pp09base.features.offer_paywall.ui.component.OfferPrimaryActionSection
import com.izisoft.pp09base.features.offer_paywall.ui.component.defaultOfferBenefits
import kotlinx.coroutines.delay

data class OfferPaywallUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val topBarTitle: String = "Limited Time Offer",
    val heroImageUrl: String = "",
    val heroBadgeText: String = "Exclusive Deal",
    val heroTitle: String = "Unlock the Vault of Minerals",
    val countdownHours: String = "23",
    val countdownMinutes: String = "59",
    val countdownSeconds: String = "59",
    val offerTitle: String = "50% OFF Annual Collector Pass",
    val offerSubtitle: String = "The ultimate toolkit for serious mineralogists.",
    val offerPrice: String = "$9.99",
    val offerPeriod: String = "/year",
    val offerOldPrice: String = "$15.99",
    val offerBenefits: List<OfferBenefitItemUi> = defaultOfferBenefits(),
    val ctaText: String = "Claim 50% Discount Now",
    val paymentSecureText: String = "Secure Encrypted Payment",
    val guaranteeText: String = "Cancel Anytime • Money-back Guarantee"
)

@Composable
fun OfferPaywallScreen(
    uiState: OfferPaywallUiState,
    onCloseClick: () -> Unit,
    onClaimOfferClick: () -> Unit,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier,
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() }
) {
    var remainingSeconds by remember(uiState.countdownHours, uiState.countdownMinutes, uiState.countdownSeconds) {
        mutableLongStateOf(
            countdownToSeconds(
                hours = uiState.countdownHours,
                minutes = uiState.countdownMinutes,
                seconds = uiState.countdownSeconds
            )
        )
    }

    LaunchedEffect(remainingSeconds) {
        if (remainingSeconds > 0) {
            delay(1000)
            remainingSeconds -= 1
        }
    }

    val displayHours = (remainingSeconds / 3600).toString().padStart(2, '0')
    val displayMinutes = ((remainingSeconds % 3600) / 60).toString().padStart(2, '0')
    val displaySeconds = (remainingSeconds % 60).toString().padStart(2, '0')

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = Color.Transparent,
        topBar = {
            OfferPaywallTopBar(
                title = uiState.topBarTitle,
                onCloseClick = onCloseClick
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = Color.Transparent
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.surface,
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f),
                                MaterialTheme.colorScheme.surface
                            )
                        )
                    )
            ) {
            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }

                uiState.error != null -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Text(
                                text = uiState.error,
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.error
                            )
                            Button(onClick = onRetryClick) {
                                Text(text = "Retry")
                            }
                        }
                    }
                }

                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 16.dp)
                            .navigationBarsPadding(),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Spacer(modifier = Modifier.height(8.dp))

                        OfferPaywallHeroSection(
                            imageUrl = uiState.heroImageUrl,
                            badgeText = uiState.heroBadgeText,
                            headline = uiState.heroTitle
                        )

                        OfferCountdownCard(
                            hours = displayHours,
                            minutes = displayMinutes,
                            seconds = displaySeconds,
                            modifier = Modifier.clip(MaterialTheme.shapes.large)
                        )

                        OfferDealCard(
                            title = uiState.offerTitle,
                            subtitle = uiState.offerSubtitle,
                            currentPrice = uiState.offerPrice,
                            currentPeriod = uiState.offerPeriod,
                            oldPrice = uiState.offerOldPrice,
                            benefits = uiState.offerBenefits
                        )

                        OfferPrimaryActionSection(
                            ctaText = uiState.ctaText,
                            paymentSecureText = uiState.paymentSecureText,
                            guaranteeText = uiState.guaranteeText,
                            isLoading = false,
                            onClaimClick = onClaimOfferClick
                        )

                        // TODO: connect countdown values to a timer state from host layer.
                        // TODO: provide localized strings from resources.

                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
            }
        }
    }
}

private fun countdownToSeconds(hours: String, minutes: String, seconds: String): Long {
    val h = hours.toLongOrNull() ?: 0L
    val m = minutes.toLongOrNull() ?: 0L
    val s = seconds.toLongOrNull() ?: 0L
    return h * 3600 + m * 60 + s
}
