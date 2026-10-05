package com.izisoft.pp09base.features.profile_subscription.ui.component

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

data class SubscriptionBenefitUi(
    val id: String,
    val title: String,
    val description: String,
    val iconName: String
)

data class ProfileSubscriptionBottomNavItemUi(
    val id: String,
    val label: String,
    val iconName: String
)

internal fun subscriptionIconForName(iconName: String): ImageVector {
    // TODO: Replace icon mapping when final icon set is delivered by design.
    return when (iconName) {
        "arrow_back" -> Icons.Filled.ArrowBack
        "verified" -> Icons.Filled.CheckCircle
        "event_repeat" -> Icons.Filled.DateRange
        "payments" -> Icons.Filled.AttachMoney
        "open_in_new" -> Icons.Filled.OpenInNew
        "bolt" -> Icons.Filled.Bolt
        "history_edu" -> Icons.Filled.History
        "cloud_done" -> Icons.Filled.CloudDone
        "home" -> Icons.Filled.Home
        "history" -> Icons.Filled.History
        "photo_camera" -> Icons.Filled.PhotoCamera
        "explore" -> Icons.Filled.Explore
        "settings" -> Icons.Filled.Settings
        else -> Icons.Filled.Settings
    }
}
