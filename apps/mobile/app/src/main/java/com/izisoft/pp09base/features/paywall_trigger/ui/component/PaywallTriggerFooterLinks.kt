package com.izisoft.pp09base.features.paywall_trigger.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun PaywallTriggerFooterLinks(
    onPrivacyPolicyClick: () -> Unit,
    onTermsClick: () -> Unit,
    onRestorePurchasesClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onPrivacyPolicyClick) {
            Text(
                text = "Privacy",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
        Box(
            modifier = Modifier
                .size(4.dp)
                .background(MaterialTheme.colorScheme.outlineVariant, CircleShape)
        )
        TextButton(onClick = onTermsClick) {
            Text(
                text = "Terms",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
        Box(
            modifier = Modifier
                .size(4.dp)
                .background(MaterialTheme.colorScheme.outlineVariant, CircleShape)
        )
        TextButton(onClick = onRestorePurchasesClick) {
            Text(
                text = "Restore",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
