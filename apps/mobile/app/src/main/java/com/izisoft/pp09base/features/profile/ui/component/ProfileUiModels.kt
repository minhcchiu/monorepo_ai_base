package com.izisoft.pp09base.features.profile.ui.component

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.ui.graphics.vector.ImageVector

data class SyncProviderUi(
    val id: String,
    val label: String,
    val iconUrl: String? = null
)

data class ProfileBottomNavItemUi(
    val id: String,
    val label: String,
    val iconName: String,
    val selected: Boolean = false,
    val centerAction: Boolean = false
)

internal fun profileIcon(iconName: String): ImageVector {
    // TODO: Replace fallback icon mapping with official Material Symbols set.
    return when (iconName) {
        "arrow_back" -> Icons.Filled.ArrowBack
        "chevron_right" -> Icons.Filled.ChevronRight
        "sync" -> Icons.Filled.Sync
        "workspace_premium" -> Icons.Filled.Star
        "arrow_forward" -> Icons.Filled.ArrowForward
        "language" -> Icons.Filled.Language
        "straighten" -> Icons.Filled.Straighten
        "help" -> Icons.Filled.Help
        "open_in_new" -> Icons.Filled.OpenInNew
        "verified_user" -> Icons.Filled.VerifiedUser
        "restore" -> Icons.Filled.Restore
        "home" -> Icons.Filled.Home
        "history" -> Icons.Filled.History
        "photo_camera" -> Icons.Filled.PhotoCamera
        "explore" -> Icons.Filled.Explore
        "settings" -> Icons.Filled.Settings
        else -> Icons.Filled.Settings
    }
}
