package com.izisoft.pp09base.features.profile_subscription.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun ProfileSubscriptionBottomBar(
    items: List<ProfileSubscriptionBottomNavItemUi>,
    selectedItemId: String,
    onItemClick: (ProfileSubscriptionBottomNavItemUi) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val selected = item.id == selectedItemId
                BottomBarItem(
                    item = item,
                    selected = selected,
                    onClick = { onItemClick(item) }
                )
            }
        }
    }
}

@Composable
private fun BottomBarItem(
    item: ProfileSubscriptionBottomNavItemUi,
    selected: Boolean,
    onClick: () -> Unit
) {
    val selectedContainer = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
    val selectedContent = MaterialTheme.colorScheme.primary
    val unselectedContent = MaterialTheme.colorScheme.onSurfaceVariant
    val container = if (selected) selectedContainer else Color.Transparent
    val contentColor = if (selected) selectedContent else unselectedContent

    Column(
        modifier = Modifier
            .clickable(onClick = onClick)
            .background(container, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Icon(
            imageVector = subscriptionIconForName(item.iconName),
            contentDescription = item.label,
            tint = contentColor
        )
        Text(
            text = item.label,
            style = MaterialTheme.typography.labelSmall,
            color = contentColor
        )
    }
}
