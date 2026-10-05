package com.izisoft.pp09base.features.profile.ui.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.R
import com.izisoft.pp09base.features.profile.ui.component.ProfileAccountSection
import com.izisoft.pp09base.features.profile.ui.component.ProfileErrorView
import com.izisoft.pp09base.features.profile.ui.component.ProfileLoadingView
import com.izisoft.pp09base.features.profile.ui.component.ProfilePreferencesCard
import com.izisoft.pp09base.features.profile.ui.component.ProfilePremiumCard
import com.izisoft.pp09base.features.profile.ui.component.ProfileSectionHeader
import com.izisoft.pp09base.features.profile.ui.component.ProfileSupportCard
import com.izisoft.pp09base.features.profile.ui.component.ProfileTopBar
import com.izisoft.pp09base.features.profile.ui.component.SyncProviderUi
import androidx.compose.ui.text.font.FontWeight

data class ProfileScreenUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val title: String = "",
    val greeting: String = "",
    val isPremium: Boolean = false,
    val brandText: String = "",
    val accountName: String = "",
    val accountRole: String = "",
    val accountAvatarUrl: String? = null,
    val syncProviders: List<SyncProviderUi> = emptyList(),
    val premiumTitle: String = "",
    val premiumSubtitle: String = "",
    val languageLabel: String = "",
    val unitMetricSelected: Boolean = true,
    val versionText: String = ""
)

@Composable
fun ProfileScreen(
    uiState: ProfileScreenUiState,
    onGoProClick: () -> Unit,
    onProfileClick: () -> Unit,
    onSyncAccountsClick: () -> Unit,
    onPremiumClick: () -> Unit,
    onLanguageClick: () -> Unit,
    onMetricClick: () -> Unit,
    onImperialClick: () -> Unit,
    onHelpCenterClick: () -> Unit,
    onPrivacyClick: () -> Unit,
    onRestorePurchaseClick: () -> Unit,
    onRateAppClick: () -> Unit,
    onLogoutClick: () -> Unit,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            ProfileTopBar(
                title = uiState.title,
                greeting = uiState.greeting,
                isPremium = uiState.isPremium,
                onGoProClick = onGoProClick
            )
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            when {
                uiState.isLoading -> ProfileLoadingView(modifier = Modifier.padding(innerPadding))

                uiState.error != null -> ProfileErrorView(
                    message = uiState.error,
                    onRetryClick = onRetryClick,
                    modifier = Modifier.padding(innerPadding)
                )

                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            top = innerPadding.calculateTopPadding() + 16.dp,
                            bottom = 80.dp
                        ),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                ProfileSectionHeader(text = stringResource(id = R.string.profile_section_account))
                                ProfileAccountSection(
                                    name = uiState.accountName,
                                    role = uiState.accountRole,
                                    avatarUrl = uiState.accountAvatarUrl,
                                    syncProviders = uiState.syncProviders,
                                    onProfileClick = onProfileClick,
                                    onSyncAccountsClick = onSyncAccountsClick
                                )
                            }
                        }

                        if (!uiState.isPremium) {
                            item {
                                ProfilePremiumCard(
                                    title = uiState.premiumTitle,
                                    subtitle = uiState.premiumSubtitle,
                                    onClick = onPremiumClick
                                )
                            }
                        } else {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = MaterialTheme.colorScheme.tertiaryContainer,
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Diamond,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onTertiaryContainer,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                            Text(
                                                text = stringResource(id = R.string.profile_membership_active),
                                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                                color = MaterialTheme.colorScheme.onTertiaryContainer
                                            )
                                            Text(
                                                text = stringResource(id = R.string.profile_membership_active_desc),
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.85f)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                ProfileSectionHeader(text = stringResource(id = R.string.profile_section_preferences))
                                ProfilePreferencesCard(
                                    languageLabel = uiState.languageLabel,
                                    unitMetricSelected = uiState.unitMetricSelected,
                                    onLanguageClick = onLanguageClick,
                                    onMetricClick = onMetricClick,
                                    onImperialClick = onImperialClick
                                )
                            }
                        }

                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                ProfileSectionHeader(text = stringResource(id = R.string.profile_section_support))
                                ProfileSupportCard(
                                    onHelpCenterClick = onHelpCenterClick,
                                    onPrivacyClick = onPrivacyClick,
                                    onRestoreClick = onRestorePurchaseClick,
                                    onRateAppClick = onRateAppClick
                                )
                            }
                        }

                        item {
                            Surface(
                                onClick = onLogoutClick,
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.surface,
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.20f))
                            ) {
                                Text(
                                    text = stringResource(id = R.string.profile_log_out),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.padding(vertical = 14.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }

                        item {
                            Text(
                                text = uiState.versionText,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outline,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }
        }
    }
}

val DefaultProfileAvatarUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD3fgYNcyBj31z1yo5CyooX-vzbm1PQkUEylPfyxiFRVA_NYZCZwAlvnyS-LoHgpcG4VIgJJpU3MK0_VauIM5iCv5XGtVpGAYu7vT0rPv-wdihSIUB-LxDgeBnbMV4-6MEuL7A8dut5ZDCqhE_PtWNe6yaL2ZJcFsjKeZQa_KBTkTI-tjSe7H2vVhiVbwMsH93-WDwJ91f71HBc4qqsOnJNNhQvY6UAE1uJYNqEE4GR3l7m7bEMsnkoJthWtrtrGBCIAaFTrGi7g9g"

val DefaultGoogleSyncIconUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBx0nGk1CBhClvb9ofzqkxMX_qYlOGgPCP-FMYSrYVybdHMUzTS6HXc7iNHBEHTAN8HXJJzE7Ig7NlfVbmd2zU9BPbw0DHJIz0LA7nQHIYuHprdspt9XFwx4h9kYOT3NaFFShxWBLQTecCBHPuPz4luDWFRegvhkkR7_rh9UW8ErE7QDcdcDrKxREKqZopMLteX5JzrJ3WkLT8RO-T6sUfB4fVxBBEQb6PXNG7KxOZ02-OOJE0WNnuJdPzLccZKGTUjGXiQVkFLH8I"

val DefaultProfileSyncProviders = listOf(
    SyncProviderUi(id = "google", label = "G", iconUrl = DefaultGoogleSyncIconUrl),
    SyncProviderUi(id = "apple", label = "iOS", iconUrl = null)
)
