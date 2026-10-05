package com.izisoft.pp09base.features.offer_paywall.ui.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CenterFocusStrong
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class OfferBottomNavItemUi(
    val id: String,
    val label: String,
    val selected: Boolean
)

@Composable
fun OfferPrimaryActionSection(
    ctaText: String,
    paymentSecureText: String,
    guaranteeText: String,
    isLoading: Boolean,
    onClaimClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Button(
            onClick = onClaimClick,
            enabled = !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = if (isLoading) "Processing..." else ctaText,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Outlined.Lock,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.outline
            )
            Text(
                text = paymentSecureText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline
            )
        }

        Text(
            text = guaranteeText,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.outline
        )
    }
}

@Composable
fun OfferPaywallBottomNav(
    items: List<OfferBottomNavItemUi>,
    onItemClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    NavigationBar(modifier = modifier.fillMaxWidth()) {
        items.forEach { item ->
            NavigationBarItem(
                selected = item.selected,
                onClick = { onItemClick(item.id) },
                icon = {
                    Icon(
                        imageVector = when (item.id) {
                            "explore" -> Icons.Outlined.Explore
                            "identify" -> Icons.Outlined.CenterFocusStrong
                            "vault" -> Icons.Outlined.Storage
                            "expert" -> Icons.Outlined.WorkspacePremium
                            else -> Icons.Outlined.Explore
                        },
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            )
        }
    }

    // TODO: replace fallback icons with product-specific icon set.
    // TODO: wire interactions to real navigation in host layer.
}

fun defaultBottomNavItems(): List<OfferBottomNavItemUi> {
    return listOf(
        OfferBottomNavItemUi(id = "explore", label = "Explore", selected = false),
        OfferBottomNavItemUi(id = "identify", label = "Identify", selected = false),
        OfferBottomNavItemUi(id = "vault", label = "Vault", selected = true),
        OfferBottomNavItemUi(id = "expert", label = "Expert", selected = false)
    )
}
