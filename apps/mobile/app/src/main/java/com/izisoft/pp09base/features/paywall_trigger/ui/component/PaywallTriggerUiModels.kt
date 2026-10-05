package com.izisoft.pp09base.features.paywall_trigger.ui.component

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdUnits
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Settings
import androidx.compose.ui.graphics.vector.ImageVector

data class PaywallTriggerBenefitUi(
    val id: String,
    val icon: ImageVector,
    val title: String,
    val description: String
)

data class PaywallTriggerPlanUi(
    val id: String,
    val title: String,
    val subtitle: String,
    val price: String,
    val badgeText: String? = null,
    val savingsText: String? = null
)

data class PaywallTriggerBottomNavItemUi(
    val id: String,
    val label: String,
    val icon: ImageVector
)

fun defaultPaywallTriggerBenefits(): List<PaywallTriggerBenefitUi> = listOf(
    PaywallTriggerBenefitUi(
        id = "unlimited_scans",
        icon = Icons.Filled.PhotoCamera,
        title = "Unlimited Scans",
        description = "Identify as many minerals as you find without limits."
    ),
    PaywallTriggerBenefitUi(
        id = "no_ads",
        icon = Icons.Filled.AdUnits,
        title = "No Ads",
        description = "Clean, professional interface with zero interruptions."
    ),
    PaywallTriggerBenefitUi(
        id = "price_estimation",
        icon = Icons.Filled.Explore,
        title = "Advanced Price Estimation",
        description = "Real-time market valuation for every specimen."
    )
)

fun defaultPaywallTriggerPlans(): List<PaywallTriggerPlanUi> = listOf(
    PaywallTriggerPlanUi(
        id = "weekly",
        title = "Weekly",
        subtitle = "Billed every 7 days",
        price = "$4.99"
    ),
    PaywallTriggerPlanUi(
        id = "yearly",
        title = "Yearly",
        subtitle = "Billed annually",
        price = "$29.99",
        badgeText = "BEST VALUE",
        savingsText = "Save 85%"
    )
)

fun defaultPaywallTriggerBottomNavItems(): List<PaywallTriggerBottomNavItemUi> = listOf(
    PaywallTriggerBottomNavItemUi("home", "Home", Icons.Filled.Home),
    PaywallTriggerBottomNavItemUi("history", "History", Icons.Filled.History),
    PaywallTriggerBottomNavItemUi("scan", "Scan", Icons.Filled.PhotoCamera),
    PaywallTriggerBottomNavItemUi("explore", "Explore", Icons.Filled.Explore),
    PaywallTriggerBottomNavItemUi("settings", "Settings", Icons.Filled.Settings)
)
