package com.izisoft.pp09base.features.profile.ui.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.R

@Composable
fun ProfilePremiumCard(
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.30f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(
                        imageVector = profileIcon("workspace_premium"),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(8.dp)
                    )
                }

                Column(modifier = Modifier.padding(start = 10.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Icon(
                imageVector = profileIcon("arrow_forward"),
                contentDescription = stringResource(id = R.string.profile_premium_content_description),
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
fun ProfilePreferencesCard(
    languageLabel: String,
    unitMetricSelected: Boolean,
    onLanguageClick: () -> Unit,
    onMetricClick: () -> Unit,
    onImperialClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        SettingRow(
            iconName = "language",
            title = stringResource(id = R.string.profile_language),
            value = languageLabel,
            onClick = onLanguageClick,
            showDivider = true
        )

        Surface(onClick = { if (unitMetricSelected) onImperialClick() else onMetricClick() }, color = MaterialTheme.colorScheme.surface) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = profileIcon("straighten"),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = stringResource(id = R.string.profile_units),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(start = 10.dp)
                    )
                }

                Row {
                    UnitChip(
                        text = stringResource(id = R.string.profile_metric),
                        selected = unitMetricSelected,
                        onClick = onMetricClick
                    )
                    UnitChip(
                        text = stringResource(id = R.string.profile_imperial),
                        selected = !unitMetricSelected,
                        onClick = onImperialClick,
                        modifier = Modifier.padding(start = 6.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileSupportCard(
    onHelpCenterClick: () -> Unit,
    onPrivacyClick: () -> Unit,
    onRestoreClick: () -> Unit,
    onRateAppClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        SettingRow(
            iconName = "help",
            title = stringResource(id = R.string.profile_help_center),
            endIconName = "open_in_new",
            onClick = onHelpCenterClick,
            showDivider = true
        )
        SettingRow(
            iconName = "verified_user",
            title = stringResource(id = R.string.profile_privacy_policy),
            endIconName = "chevron_right",
            onClick = onPrivacyClick,
            showDivider = true
        )
        SettingRow(
            iconName = "restore",
            title = stringResource(id = R.string.profile_restore_purchase),
            endIconName = "chevron_right",
            onClick = onRestoreClick,
            showDivider = true
        )
        SettingRow(
            iconName = "workspace_premium",
            title = stringResource(id = R.string.profile_rate_app),
            endIconName = "chevron_right",
            onClick = onRateAppClick,
            showDivider = false
        )
    }
}

@Composable
private fun SettingRow(
    iconName: String,
    title: String,
    value: String? = null,
    endIconName: String? = null,
    onClick: () -> Unit,
    showDivider: Boolean
) {
    Surface(onClick = onClick, color = MaterialTheme.colorScheme.surface) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = profileIcon(iconName),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(start = 10.dp)
                    )
                }

                when {
                    value != null -> Text(
                        text = value,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    endIconName != null -> Icon(
                        imageVector = profileIcon(endIconName),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (showDivider) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .height(1.dp),
                ) { Surface(modifier = Modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.outlineVariant) {} }
            }
        }
    }
}

@Composable
private fun UnitChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val container = if (selected) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.surfaceVariant
    val content = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant

    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = container,
        border = BorderStroke(
            width = 1.dp,
            color = if (selected) MaterialTheme.colorScheme.outlineVariant else MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            color = content,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
