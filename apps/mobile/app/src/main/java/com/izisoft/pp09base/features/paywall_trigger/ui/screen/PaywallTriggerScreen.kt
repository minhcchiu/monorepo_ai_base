package com.izisoft.pp09base.features.paywall_trigger.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.features.paywall_trigger.ui.component.PaywallTriggerBenefitUi
import com.izisoft.pp09base.features.paywall_trigger.ui.component.PaywallTriggerBenefitItem
import com.izisoft.pp09base.features.paywall_trigger.ui.component.PaywallTriggerHeroSection
import com.izisoft.pp09base.features.paywall_trigger.ui.component.PaywallTriggerPlanOptionCard
import com.izisoft.pp09base.features.paywall_trigger.ui.component.PaywallTriggerPlanUi
import com.izisoft.pp09base.features.paywall_trigger.ui.component.defaultPaywallTriggerBenefits
import com.izisoft.pp09base.features.paywall_trigger.ui.component.defaultPaywallTriggerPlans

data class PaywallTriggerScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val heroImageUrl: String = "https://lh3.googleusercontent.com/aida-public/AB6AXuDNgZK9JlAWV7CvAd7__ChG4TrCXPwizvi4WFFMYcobuGZJXAA57wyj4aV6W6azEyxrb3ASAZJ-o-rZgDfBpXY3atMYNiyOvpT9ji8TJtdn5-N7N9qYGZHwGaZvRzKljTG1QGm3qeAPyPGZWsAJZJx5wHljqo9MLvOU_o0cxJQq18mRV3L1EL8s62Qlg6AteF9RU2WnIoxfBpX9FOVEWm_ZrnDL7eqkezkW0rFKc5QniH5sIRnm59max_PmetfJYmei_ZpfG1Ylslk",
    val badgeText: String = "PREMIUM ACCESS",
    val title: String = "Unlock Pro Insights",
    val benefits: List<PaywallTriggerBenefitUi> = defaultPaywallTriggerBenefits(),
    val plans: List<PaywallTriggerPlanUi> = defaultPaywallTriggerPlans(),
    val selectedPlanId: String = "yearly",
    val subscribeButtonText: String = "Continue to Secure Checkout"
)

@Composable
fun PaywallTriggerScreen(
    uiState: PaywallTriggerScreenUiState,
    onCloseClick: () -> Unit,
    onPlanSelect: (String) -> Unit,
    onSubscribeClick: () -> Unit,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
    ) {
        when {
            uiState.isLoading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            uiState.error != null -> {
                Column(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(horizontal = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = uiState.error,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                    Button(onClick = onRetryClick) {
                        Text(text = "Retry")
                    }
                }
            }

            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.Start
                ) {
                    PaywallTriggerHeroSection(
                        imageUrl = uiState.heroImageUrl,
                        badgeText = uiState.badgeText,
                        title = uiState.title,
                        onCloseClick = onCloseClick,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Everything in Premium",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        uiState.benefits.forEach { benefit ->
                            PaywallTriggerBenefitItem(
                                icon = benefit.icon,
                                title = benefit.title,
                                description = benefit.description,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Choose your plan",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        uiState.plans.forEach { plan ->
                            PaywallTriggerPlanOptionCard(
                                plan = plan,
                                isSelected = plan.id == uiState.selectedPlanId,
                                onClick = { onPlanSelect(plan.id) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Button(
                            onClick = onSubscribeClick,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            shape = MaterialTheme.shapes.large,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            )
                        ) {
                            Text(
                                text = uiState.subscribeButtonText,
                                style = MaterialTheme.typography.titleMedium
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
    }
}
