package com.izisoft.pp09base.features.subscription_paywall.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallBackground
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallBenefitCard
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallBenefitItemUi
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallCtaSection
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallFooter
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallFooterLinkUi
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallHeroSection
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallPlanOptionCard
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallPlanUi
import com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallTopBar

data class SubscriptionPaywallScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val backgroundImageUrl: String = "https://lh3.googleusercontent.com/aida-public/AB6AXuCiY9jUP5rPJZ8HtL03TNwLpu6BUsHM--LBDCuxIwRqVdeQdfvey9c83QSHl78AoKHG3hMEsN7k0jAVbcSHqpgpl05M1GvuRvy27C-GtyLdFyG87eqAcA2CSL7SQV8ksbo8grb-7lPPabMkz3vrQz9gXZNYLZzWi3ok3WQFVq47WRPQvOBCGgrD5VNgxHkjgLEtfjv474K5ArrM7z4vAHtakXjk43HwWgYvcugFiJyCWBkpltUJTE9IuqUdxY_AMgeDFOvTUtVZ-Ak",
    val badgeText: String = "Premium Access",
    val title: String = "Unlock Premium",
    val subtitle: String = "Experience the ultimate geological identification toolset.",
    val benefits: List<PaywallBenefitItemUi> = defaultPaywallBenefits(),
    val plans: List<PaywallPlanUi> = defaultPaywallPlans(),
    val selectedPlanId: String = "yearly",
    val ctaText: String = "Subscribe Now",
    val trialInfoText: String = "$15.99/year. Cancel anytime.",
    val footerLinks: List<PaywallFooterLinkUi> = defaultFooterLinks(),
    val footerDisclaimer: String = "Subscription will automatically renew unless canceled 24 hours before the end of the current period."
)

@Composable
fun SubscriptionPaywallScreen(
    uiState: SubscriptionPaywallScreenUiState,
    onCloseClick: () -> Unit,
    onPlanSelect: (String) -> Unit,
    onStartTrialClick: () -> Unit,
    onRestorePurchaseClick: () -> Unit,
    onTermsClick: () -> Unit,
    onPrivacyClick: () -> Unit,
    onRetryClick: () -> Unit,
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
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = uiState.error,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(onClick = onRetryClick) {
                        Text(text = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.retry))
                    }
                }
            }

            else -> {
                Box(modifier = Modifier.fillMaxSize()) {
                    PaywallBackground(
                        imageUrl = uiState.backgroundImageUrl,
                        modifier = Modifier.fillMaxSize()
                    )

                    Column(modifier = Modifier.fillMaxSize()) {
                        PaywallTopBar(
                            onCloseClick = onCloseClick,
                            onRestoreClick = onRestorePurchaseClick,
                            title = androidx.compose.ui.res.stringResource(id = com.izisoft.pp09base.R.string.rock_ai_premium),
                            closeIcon = Icons.Default.Close,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp)
                        )

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f)
                                .verticalScroll(rememberScrollState())
                                .padding(horizontal = 16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            PaywallHeroSection(
                                badgeText = uiState.badgeText,
                                title = uiState.title,
                                subtitle = uiState.subtitle,
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                uiState.benefits.forEach { benefit ->
                                    PaywallBenefitCard(
                                        title = benefit.title,
                                        description = benefit.description,
                                        icon = when (benefit.iconKey) {
                                            "verified" -> Icons.Default.Verified
                                            "block" -> Icons.Default.Block
                                            "trending_up" -> Icons.Default.TrendingUp
                                            else -> Icons.Default.Verified
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                uiState.plans.forEach { plan ->
                                    PaywallPlanOptionCard(
                                        plan = plan,
                                        isSelected = plan.id == uiState.selectedPlanId,
                                        onClick = { onPlanSelect(plan.id) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .navigationBarsPadding(),
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                            tonalElevation = 8.dp
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                PaywallCtaSection(
                                    ctaText = uiState.ctaText,
                                    detailText = uiState.trialInfoText,
                                    onCtaClick = onStartTrialClick,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                PaywallFooter(
                                    links = uiState.footerLinks,
                                    disclaimerText = uiState.footerDisclaimer,
                                    onRestorePurchaseClick = onRestorePurchaseClick,
                                    onTermsClick = onTermsClick,
                                    onPrivacyClick = onPrivacyClick,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun defaultPaywallBenefits(): List<PaywallBenefitItemUi> = listOf(
    PaywallBenefitItemUi(
        iconKey = "verified",
        title = "Unlimited Scans",
        description = "No daily limits on mineral identification."
    ),
    PaywallBenefitItemUi(
        iconKey = "block",
        title = "No Ads",
        description = "Seamless experience without interruptions."
    ),
    PaywallBenefitItemUi(
        iconKey = "trending_up",
        title = "Advanced Price Estimation",
        description = "Real-time market value for your collection."
    )
)

private fun defaultPaywallPlans(): List<PaywallPlanUi> = listOf(
    PaywallPlanUi(
        id = "weekly",
        name = "Weekly",
        price = "$2.99",
        subtitle = "Billed weekly"
    ),
    PaywallPlanUi(
        id = "yearly",
        name = "Yearly",
        price = "$15.99",
        subtitle = "Best value",
        badge = "Best Value"
    )
)

private fun defaultFooterLinks(): List<PaywallFooterLinkUi> = listOf(
    PaywallFooterLinkUi(id = "restore", label = "Restore Purchase"),
    PaywallFooterLinkUi(id = "terms", label = "Terms"),
    PaywallFooterLinkUi(id = "privacy", label = "Privacy")
)
