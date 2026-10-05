package com.izisoft.pp09base.features.profile_subscription.ui.screen

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import com.izisoft.pp09base.R
import com.izisoft.pp09base.features.profile_subscription.ui.component.SubscriptionBenefitUi
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionBottomBar
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionBottomNavItemUi
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionBenefitsSection
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionErrorView
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionLoadingView
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionPlanCard
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionSecondaryActions
import com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionTopBar
import androidx.compose.foundation.layout.Arrangement

@Composable
fun ProfileSubscriptionScreen(
    uiState: ProfileSubscriptionScreenUiState,
    onBackClick: () -> Unit,
    onManagePlanClick: () -> Unit,
    onRestorePurchaseClick: () -> Unit,
    onCancelSubscriptionClick: () -> Unit,
    onBottomNavClick: (ProfileSubscriptionBottomNavItemUi) -> Unit,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            ProfileSubscriptionTopBar(
                title = uiState.title,
                brandName = uiState.brandName,
                onBackClick = onBackClick
            )
        },
        bottomBar = {
            ProfileSubscriptionBottomBar(
                items = uiState.bottomNavItems,
                selectedItemId = uiState.selectedBottomNavId,
                onItemClick = onBottomNavClick
            )
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = MaterialTheme.colorScheme.background
        ) {
            when {
                uiState.isLoading -> ProfileSubscriptionLoadingView()

                uiState.error != null -> {
                    ProfileSubscriptionErrorView(
                        message = uiState.error,
                        onRetryClick = onRetryClick
                    )
                }

                else -> {
                    if (uiState.hasPurchased) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                                start = 16.dp,
                                end = 16.dp,
                                top = 24.dp,
                                bottom = 96.dp
                            )
                        ) {
                            item {
                                ProfileSubscriptionPlanCard(
                                    currentPlanLabel = uiState.currentPlanLabel,
                                    planName = uiState.planName,
                                    statusLabel = uiState.statusLabel,
                                    renewalLabel = uiState.renewalLabel,
                                    priceLabel = uiState.priceLabel,
                                    accentImageUrl = uiState.accentImageUrl,
                                    onManagePlanClick = onManagePlanClick
                                )
                            }

                            item {
                                ProfileSubscriptionBenefitsSection(
                                    title = stringResource(id = R.string.profile_subscription_benefits_title),
                                    benefits = uiState.benefits,
                                    modifier = Modifier.padding(top = 16.dp)
                                )
                            }

                            item {
                                Column(modifier = Modifier.padding(top = 16.dp)) {
                                    ProfileSubscriptionSecondaryActions(
                                        onRestorePurchaseClick = onRestorePurchaseClick,
                                        onCancelSubscriptionClick = onCancelSubscriptionClick,
                                        note = uiState.footerNote
                                    )
                                }
                            }
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                                start = 16.dp,
                                end = 16.dp,
                                top = 24.dp,
                                bottom = 96.dp
                            )
                        ) {
                            item {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    Text(
                                        stringResource(id = R.string.profile_subscription_no_active),
                                        style = MaterialTheme.typography.headlineSmall
                                    )
                                    ProfileSubscriptionBenefitsSection(
                                        title = stringResource(id = R.string.profile_subscription_benefits_title),
                                        benefits = uiState.benefits
                                    )
                                    Column(modifier = Modifier.padding(top = 16.dp)) {
                                        ProfileSubscriptionSecondaryActions(
                                            onRestorePurchaseClick = onRestorePurchaseClick,
                                            onCancelSubscriptionClick = onCancelSubscriptionClick,
                                            note = stringResource(id = R.string.profile_subscription_unlock_note)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

data class ProfileSubscriptionScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val hasPurchased: Boolean = false,
    val title: String = "Subscription",
    val brandName: String = "PP09 Base",
    val currentPlanLabel: String = "Current Plan",
    val planName: String = "Yearly Plan",
    val statusLabel: String = "Active",
    val renewalLabel: String = "Renews on July 15, 2025",
    val priceLabel: String = "$89.99 / year",
    val accentImageUrl: String? = DefaultProfileSubscriptionAccentImageUrl,
    val benefits: List<SubscriptionBenefitUi> = DefaultProfileSubscriptionBenefits,
    val footerNote: String = "You can change or cancel your subscription at any time in your device account settings.",
    val bottomNavItems: List<ProfileSubscriptionBottomNavItemUi> = DefaultProfileSubscriptionBottomNavItems,
    val selectedBottomNavId: String = "settings"
)

val DefaultProfileSubscriptionBenefits = listOf(
    SubscriptionBenefitUi(
        id = "unlimited_scans",
        title = "Unlimited Scans",
        description = "Identify any mineral instantly",
        iconName = "bolt"
    ),
    SubscriptionBenefitUi(
        id = "advanced_history",
        title = "Advanced History",
        description = "Full chemical composition data",
        iconName = "history_edu"
    ),
    SubscriptionBenefitUi(
        id = "cloud_sync",
        title = "Cloud Sync",
        description = "Access collection on any device",
        iconName = "cloud_done"
    )
)

val DefaultProfileSubscriptionBottomNavItems = listOf(
    ProfileSubscriptionBottomNavItemUi(id = "home", label = "Home", iconName = "home"),
    ProfileSubscriptionBottomNavItemUi(id = "history", label = "History", iconName = "history"),
    ProfileSubscriptionBottomNavItemUi(id = "scan", label = "Scan", iconName = "photo_camera"),
    ProfileSubscriptionBottomNavItemUi(id = "explore", label = "Explore", iconName = "explore"),
    ProfileSubscriptionBottomNavItemUi(id = "settings", label = "Settings", iconName = "settings")
)

const val DefaultProfileSubscriptionAccentImageUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCPp6vZceLkSlelv6PMc7c_CQGfzzrlU9a_vVimN4CIjrvkM-3eDDezahDt2_CL_FYxHc6EInOWPSa6JVLjmdIaYhfOuedFfghyMCzZ7XHgoXvD-aJRPGnh8kgTJtJaqphQAEBW0mTqkZaWb1pc3GZDp3cpwtg0TKVDiZXM3mnYxhZaPepwhutnUwpopL_oKn_lwOvLmNuFBNgybKvVpneJGni6ts8pCJhcse0wiVNdoEWp5rULb7wfjxvauHZvBvVlVTqgdyOM1Cw"
