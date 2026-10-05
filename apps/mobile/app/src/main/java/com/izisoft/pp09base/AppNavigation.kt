package com.izisoft.pp09base

import android.widget.Toast
import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.izisoft.pp09base.core.ads.AdsEntryPoint
import com.izisoft.pp09base.core.firebase.AppAnalytics
import dagger.hilt.android.EntryPointAccessors
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.izisoft.pp09base.features.login.logic.LoginViewModel
import com.izisoft.pp09base.features.login.ui.screen.LoginScreen
import com.izisoft.pp09base.features.offline_state.ui.screen.OfflineStateScreen
import com.izisoft.pp09base.features.offline_state.ui.screen.OfflineStateScreenUiState
import com.izisoft.pp09base.features.offer_paywall.ui.screen.OfferPaywallScreen
import com.izisoft.pp09base.features.offer_paywall.ui.screen.OfferPaywallUiState as OfferPaywallScreenUiState
import com.izisoft.pp09base.features.offer_paywall.logic.OfferPaywallViewModel
import com.izisoft.pp09base.features.onboarding.logic.OnboardingViewModel
import com.izisoft.pp09base.features.onboarding.ui.screen.OnboardingScreen
import com.izisoft.pp09base.features.onboarding1.logic.Onboarding1ViewModel
import com.izisoft.pp09base.features.onboarding1.ui.screen.Onboarding1Screen
import com.izisoft.pp09base.features.onboarding_final.logic.OnboardingFinalViewModel
import com.izisoft.pp09base.features.onboarding_final.ui.screen.OnboardingFinalScreen
import com.izisoft.pp09base.features.onboarding_final.ui.screen.OnboardingFinalScreenUiState
import com.izisoft.pp09base.features.paywall_trigger.logic.PaywallTriggerViewModel
import com.izisoft.pp09base.features.paywall_trigger.ui.screen.PaywallTriggerScreen
import com.izisoft.pp09base.features.paywall_trigger.ui.screen.PaywallTriggerScreenUiState
import com.izisoft.pp09base.features.permission_request.logic.PermissionRequestViewModel
import com.izisoft.pp09base.features.permission_request.ui.screen.PermissionRequestScreen
import com.izisoft.pp09base.features.premium_success.logic.PremiumSuccessViewModel
import com.izisoft.pp09base.features.premium_success.ui.screen.DefaultPremiumOrderSummary
import com.izisoft.pp09base.features.premium_success.ui.screen.DefaultPremiumSuccessFeatures
import com.izisoft.pp09base.features.premium_success.ui.screen.PremiumSuccessScreen
import com.izisoft.pp09base.features.premium_success.ui.screen.PremiumSuccessScreenUiState
import com.izisoft.pp09base.features.profile.logic.ProfileViewModel
import com.izisoft.pp09base.features.profile.ui.component.LanguageSelectionDialog
import com.izisoft.pp09base.features.profile.ui.component.profileLanguageLabelForUi
import com.izisoft.pp09base.features.profile.ui.component.profileLanguageLocaleTag
import com.izisoft.pp09base.features.profile.ui.screen.DefaultProfileAvatarUrl
import com.izisoft.pp09base.features.profile.ui.screen.DefaultProfileSyncProviders
import com.izisoft.pp09base.features.profile.ui.screen.ProfileHelpCenterScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfilePrivacyPolicyScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfileScreen
import com.izisoft.pp09base.features.profile.ui.screen.ProfileScreenUiState
import com.izisoft.pp09base.features.profile_subscription.logic.ProfileSubscriptionViewModel
import com.izisoft.pp09base.features.profile_subscription.ui.screen.ProfileSubscriptionScreen
import com.izisoft.pp09base.features.profile_subscription.ui.screen.ProfileSubscriptionScreenUiState
import com.izisoft.pp09base.features.register.logic.RegisterViewModel
import com.izisoft.pp09base.features.register.ui.screen.RegisterScreen
import com.izisoft.pp09base.features.splash.logic.SplashViewModel
import com.izisoft.pp09base.features.splash.ui.screen.SplashScreen
import com.izisoft.pp09base.features.subscription_paywall.logic.SubscriptionPaywallViewModel
import com.izisoft.pp09base.features.subscription_paywall.ui.screen.SubscriptionPaywallScreen
import com.izisoft.pp09base.features.subscription_paywall.ui.screen.SubscriptionPaywallScreenUiState
import com.izisoft.pp09base.features.welcome.logic.WelcomeViewModel
import com.izisoft.pp09base.features.welcome.ui.screen.WelcomeScreen
import com.izisoft.pp09base.core.rating.FeedbackDialog
import com.izisoft.pp09base.core.rating.RatingManager
import com.izisoft.pp09base.core.rating.SatisfactionDialog
import java.util.Locale
import kotlinx.coroutines.launch

private const val DefaultOnboardingFinalHeroImageUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDBKVUTJ4phninZyzLgiibp36vm5dSK0giKCAbt48ockAAA-E4cE7H9lt2f8IjxpaA1q9RKcfUYmJCWtwwJqHD4IcFXERcBKqmMtGImu1_ROen4YiFfsRenykh65dYtXT4ClTW2WyD3LnvmdWZ_FnNtDthuNYOWYR4Eum_mQEolkxTiMCQZ5k-vmA7Wa5Wu95iWc4uRpwPci8jKsy7YxIv3IwdZKH2PCFJt-ZCLszp1TuHZdFEJ5tMV4nSLWeDJ7_yzoDzO5SDVfqI"

private fun NavHostController.navigateSingleTopTo(route: String) {
    navigate(route) {
        launchSingleTop = true
    }
}

private fun NavHostController.navigateBottomBarTo(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}

private fun friendlyBillingSubtitle(billingPeriod: String, productId: String): String {
    return when {
        billingPeriod.equals("P1W", ignoreCase = true) -> "Billed weekly"
        billingPeriod.equals("P1M", ignoreCase = true) -> "Billed monthly"
        billingPeriod.equals("P3M", ignoreCase = true) -> "Billed every 3 months"
        billingPeriod.equals("P6M", ignoreCase = true) -> "Billed every 6 months"
        billingPeriod.equals("P1Y", ignoreCase = true) -> "Billed yearly"
        productId.contains("week", ignoreCase = true) -> "Billed weekly"
        productId.contains("month", ignoreCase = true) -> "Billed monthly"
        productId.contains("year", ignoreCase = true) -> "Billed yearly"
        else -> "Auto-renewing subscription"
    }
}

private fun applyAppLocale(context: Context, localeTag: String) {
    val locale = Locale.forLanguageTag(localeTag)
    val resources = context.resources
    val currentLocale = resources.configuration.locales.get(0)
    if (currentLocale != null && currentLocale.toLanguageTag().equals(locale.toLanguageTag(), ignoreCase = true)) {
        return
    }

    Locale.setDefault(locale)
    val config = Configuration(resources.configuration)
    config.setLocale(locale)
    resources.updateConfiguration(config, resources.displayMetrics)
}

@Composable
fun AppNavigation(
    isOnline: Boolean,
    splashViewModel: SplashViewModel,
    loginViewModel: LoginViewModel,
    registerViewModel: RegisterViewModel,
    onboardingViewModel: OnboardingViewModel,
    onboarding1ViewModel: Onboarding1ViewModel,
    onboardingFinalViewModel: OnboardingFinalViewModel,
    permissionRequestViewModel: PermissionRequestViewModel,
    subscriptionPaywallViewModel: SubscriptionPaywallViewModel,
    welcomeViewModel: WelcomeViewModel,
    paywallTriggerViewModel: PaywallTriggerViewModel,
    premiumSuccessViewModel: PremiumSuccessViewModel,
    profileViewModel: ProfileViewModel,
    profileSubscriptionViewModel: ProfileSubscriptionViewModel,
    offerPaywallViewModel: OfferPaywallViewModel,
    appAnalytics: AppAnalytics,
    ratingManager: RatingManager,
    paywallTriggerManager: com.izisoft.pp09base.core.paywall.PaywallTriggerManager
) {
    val navController = rememberNavController()
    val rootContext = LocalContext.current
    val rootActivity = rootContext as? android.app.Activity
    val rootScope = rememberCoroutineScope()
    val premiumStatusManager = remember {
        EntryPointAccessors.fromApplication(
            rootContext.applicationContext,
            AdsEntryPoint::class.java
        ).premiumStatusManager()
    }
    val isPremium by premiumStatusManager.isPremium.collectAsState()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStackEntry?.destination?.route

    LaunchedEffect(isOnline, currentRoute) {
        if (!isOnline && currentRoute != Routes.OFFLINE_STATE) {
            navController.navigateSingleTopTo(Routes.OFFLINE_STATE)
        } else if (isOnline && currentRoute == Routes.OFFLINE_STATE) {
            navController.popBackStack()
        }
    }

    LaunchedEffect(currentRoute) {
        appAnalytics.logScreen(currentRoute)
    }

    LaunchedEffect(isPremium) {
        appAnalytics.setPremiumUser(isPremium)
        paywallTriggerViewModel.updatePremiumStatus(isPremium)
    }

    NavHost(navController = navController, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(
                    viewModel = splashViewModel,
                    onNavigate = { destination ->
                        navController.navigate(destination) {
                            popUpTo(Routes.SPLASH) { inclusive = true }
                        }
                    }
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                    viewModel = loginViewModel,
                    onNavigateToRegister = { navController.navigateSingleTopTo(Routes.REGISTER) }
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                    viewModel = registerViewModel,
                    onNavigateToLogin = {
                        navController.navigate(Routes.LOGIN) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    }
            )
        }

        composable(Routes.ONBOARDING) {
            OnboardingScreen(
                    viewModel = onboardingViewModel,
                    onBack = { navController.popBackStack() },
                    onFinished = {
                        navController.navigate(Routes.ONBOARDING1) {
                            popUpTo(Routes.ONBOARDING) { inclusive = true }
                        }
                    }
            )
        }

        composable(Routes.ONBOARDING1) {
            Onboarding1Screen(
                    viewModel = onboarding1ViewModel,
                    onBack = { navController.popBackStack() },
                    onFinished = {
                        navController.navigate(Routes.ONBOARDING_FINAL) {
                            popUpTo(Routes.ONBOARDING1) { inclusive = true }
                        }
                    }
            )
        }

        composable(Routes.ONBOARDING_FINAL) {
            val finalState by onboardingFinalViewModel.state.collectAsState()
            OnboardingFinalScreen(
                    uiState =
                            OnboardingFinalScreenUiState(
                                    isLoading = finalState.isLoading,
                                    error = finalState.error,
                                    heroImageUrl = finalState.data.firstOrNull()?.imageUrl ?: DefaultOnboardingFinalHeroImageUrl,
                                    title = stringResource(id = com.izisoft.pp09base.R.string.onboarding_final_title),
                                    description = stringResource(id = com.izisoft.pp09base.R.string.onboarding_final_description),
                                    ctaText = stringResource(id = com.izisoft.pp09base.R.string.start_scanning_now),
                                    socialProofText = stringResource(id = com.izisoft.pp09base.R.string.onboarding_final_social_proof),
                                    footerText = stringResource(id = com.izisoft.pp09base.R.string.onboarding_final_footer),
                                    avatarImageUrls =
                                            listOf(
                                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKq7LHdz7O_9I0twpNn8rsosQrMoYMgzUdTWOejwAcnbgFroDzoWgqqjSnyH1HvQUCEv0ghaMFp2kNs1EbkcsgloAo5-osa2peJyztAmaY4O-mVtaoBvegvL4zekGg4rzjqLBvxNXq15gQAFtqonOTyyPyQ2Qb66iJO4wKwcpBpykXWGJv_Zul_WD6Fx-6m6dZoNL64zuJEqqwcEklpHiFPpLxnilOWFpghow-RfPnpM-xTBxYzAgnp5KPtjNaRHjJrW43-DGSZhU",
                                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCsOr9OJuMqJJayXQRLtCReFf8gDi2zvIYmvcDxCYp3qMDAKhf6cPXllPslzUUXX-YheVFPRPNyYWy4fdKEXHQAVY0I38mwK2-zoWqLPKmtIlbCfAXLhIjLtgYQ_qhNKuMbWLQ1kJ6UUncOQmp4A9ulU8qXYJV5wg3YNWx0l5Ex7VUaP2kYg-GDidylvx5G3jEjfRzEWWqaIUliGNQ17QdAklyLXgzGX1BF-qB7oTniZ3ZeMN5KDpRDOGMb1sA4PCCO8UV8KkH2AqM",
                                                    "https://lh3.googleusercontent.com/aida-public/AB6AXuC8K83n7bbyl6ZF2sbhKHxke8MXc3WL21G66icjHBNsNVAzwpl8V2UymZ8RD2YfoJBsjQXdTwVNpTzFvsNooV-e_MZ7mv2QKC73Q1VsA8_uxsnRGl28rkTg3ljiLiwm5jmdJTc1ATKhC2BAoa1CWBnpNgpKKqwH6H207ZoyaOxIb71nDdhkQA9NRDxcbZygGuAsjIwwQ-vX6Z-b8Js2X6WCUv1YxY6u1g7RS09tf1gA4olh_Dxdjxec0ECD243_mDLngrUbywt8cmU"
                                            )
                            ),
                    onBack = { navController.popBackStack() },
                    onSkip = {
                        navController.navigate(Routes.PERMISSION_REQUEST) {
                            popUpTo(Routes.ONBOARDING_FINAL) { inclusive = true }
                        }
                    },
                    onPrimaryAction = {
                        onboardingFinalViewModel.completeOnboarding()
                        navController.navigate(Routes.PERMISSION_REQUEST) {
                            popUpTo(Routes.ONBOARDING_FINAL) { inclusive = true }
                        }
                    },
                    onRetry = { onboardingFinalViewModel.fetchFinalSteps() }
            )
        }

        composable(Routes.PERMISSION_REQUEST) {
            PermissionRequestScreen(
                    viewModel = permissionRequestViewModel,
                    onBackClick = { navController.popBackStack() },
                    onSkipClick = {
                        navController.navigate(Routes.SUBSCRIPTION_PAYWALL) {
                            popUpTo(Routes.PERMISSION_REQUEST) { inclusive = true }
                        }
                    },
                    onAllowAccessClick = {
                        navController.navigate(Routes.SUBSCRIPTION_PAYWALL) {
                            popUpTo(Routes.PERMISSION_REQUEST) { inclusive = true }
                        }
                    },
                    onMaybeLaterClick = {
                        navController.navigate(Routes.SUBSCRIPTION_PAYWALL) {
                            popUpTo(Routes.PERMISSION_REQUEST) { inclusive = true }
                        }
                    }
            )
        }

        composable(Routes.SUBSCRIPTION_PAYWALL) {
            val subscriptionPaywallState by subscriptionPaywallViewModel.state.collectAsState()
            var selectedPlanId by rememberSaveable { mutableStateOf("sub_yearly") }

            LaunchedEffect(subscriptionPaywallState.products) {
                val productIds = subscriptionPaywallState.products.map { it.id }
                if (productIds.isEmpty()) return@LaunchedEffect

                if (selectedPlanId !in productIds) {
                    selectedPlanId = productIds.firstOrNull { it.contains("year", ignoreCase = true) }
                        ?: productIds.first()
                }
            }

            val plans = if (subscriptionPaywallState.products.isEmpty()) {
                SubscriptionPaywallScreenUiState().plans
            } else {
                subscriptionPaywallState.products.map { product ->
                    com.izisoft.pp09base.features.subscription_paywall.ui.component.PaywallPlanUi(
                        id = product.id,
                        name = product.name,
                        price = product.price,
                        subtitle = friendlyBillingSubtitle(product.billingPeriod, product.id),
                        trialLabel = null,
                        trialInfo = null,
                        badge = if (product.id.contains("year", ignoreCase = true)) "Best Value" else null
                    )
                }
            }

            val selectedPlan = plans.firstOrNull { it.id == selectedPlanId }

            LaunchedEffect(subscriptionPaywallState.purchaseSuccess) {
                if (subscriptionPaywallState.purchaseSuccess) {
                    premiumSuccessViewModel.setPurchasedPlan(
                        planName = selectedPlan?.name,
                        price = selectedPlan?.price
                    )
                    premiumSuccessViewModel.load()
                    subscriptionPaywallViewModel.consumePurchaseSuccess()
                    navController.navigateSingleTopTo(Routes.PREMIUM_SUCCESS)
                }
            }

            SubscriptionPaywallScreen(
                uiState = SubscriptionPaywallScreenUiState(
                    isLoading = subscriptionPaywallState.isLoading,
                    error = subscriptionPaywallState.error,
                    badgeText = stringResource(id = com.izisoft.pp09base.R.string.paywall_badge),
                    title = stringResource(id = com.izisoft.pp09base.R.string.paywall_title),
                    subtitle = stringResource(id = com.izisoft.pp09base.R.string.paywall_subtitle),
                    plans = plans,
                    selectedPlanId = selectedPlanId,
                    ctaText = if (selectedPlan != null) {
                        "Subscribe · ${selectedPlan.price}"
                    } else {
                        stringResource(id = com.izisoft.pp09base.R.string.paywall_start_trial_default)
                    },
                    trialInfoText = "${selectedPlan?.subtitle ?: stringResource(id = com.izisoft.pp09base.R.string.paywall_trial_info_default)} · Cancel anytime",
                    footerDisclaimer = stringResource(id = com.izisoft.pp09base.R.string.paywall_footer_disclaimer)
                ),
                onCloseClick = {
                    appAnalytics.logAction("paywall_close_click")
                    val showOffer = paywallTriggerManager.onSubscriptionPaywallClosed(
                        source = "subscription_close",
                        isPremium = isPremium
                    )
                    if (showOffer) {
                        paywallTriggerManager.onOfferPaywallAboutToShow("subscription_close")
                        navController.navigate(Routes.OFFER_PAYWALL) {
                            popUpTo(Routes.SUBSCRIPTION_PAYWALL) { inclusive = true }
                            launchSingleTop = true
                        }
                    } else {
                        navController.navigate(Routes.MAIN) {
                            popUpTo(Routes.SUBSCRIPTION_PAYWALL) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
                },
                onPlanSelect = { selectedPlanId = it },
                onStartTrialClick = {
                    appAnalytics.logAction("paywall_start_trial_click", mapOf("plan_id" to selectedPlanId))
                    subscriptionPaywallViewModel.purchase(selectedPlanId)
                },
                onRestorePurchaseClick = {
                    appAnalytics.logAction("paywall_restore_click")
                    subscriptionPaywallViewModel.restorePurchases()
                },
                onTermsClick = { /* TODO: open terms link */ },
                onPrivacyClick = { /* TODO: open privacy link */ },
                onRetryClick = { subscriptionPaywallViewModel.loadProducts() }
            )
        }

        composable(Routes.WELCOME) {
            WelcomeScreen(
                    viewModel = welcomeViewModel,
                    onContinue = {
                        navController.navigate(Routes.MAIN) {
                            popUpTo(Routes.SPLASH) { inclusive = true }
                            launchSingleTop = true
                        }
                    }
            )
        }

        composable(Routes.PAYWALL_TRIGGER) {
            val paywallState = paywallTriggerViewModel.state.collectAsState()
            var selectedPlanId by rememberSaveable { mutableStateOf("yearly") }

            PaywallTriggerScreen(
                uiState = PaywallTriggerScreenUiState(
                    isLoading = paywallState.value.isLoading,
                    error = paywallState.value.error,
                    selectedPlanId = selectedPlanId
                ),
                onCloseClick = { navController.popBackStack() },
                onPlanSelect = { selectedPlanId = it },
                onSubscribeClick = { navController.navigateSingleTopTo(Routes.SUBSCRIPTION_PAYWALL) },
                onRetryClick = { paywallTriggerViewModel.trigger() }
            )
        }

        composable(Routes.OFFER_PAYWALL) {
            val offerState by offerPaywallViewModel.state.collectAsState()

            val realPrice = offerState.offerPrice.takeIf { it.isNotBlank() }

            val ctaText = when {
                offerState.isPurchasing -> "Processing..."
                else -> "Claim Offer · $9.99/yr"
            }
            val guaranteeText = "Cancel Anytime · Money-back Guarantee"

            LaunchedEffect(offerState.purchaseSuccess) {
                if (offerState.purchaseSuccess) {
                    premiumSuccessViewModel.setPurchasedPlan(
                        planName = "Annual Collector Pass",
                        price = "${offerState.offerPrice.ifBlank { "9.99" }}"
                    )
                    premiumSuccessViewModel.load()
                    offerPaywallViewModel.consumeEvents()
                    navController.navigateSingleTopTo(Routes.PREMIUM_SUCCESS)
                }
            }

            OfferPaywallScreen(
                uiState = OfferPaywallScreenUiState(
                    isLoading = offerState.isLoading,
                    error = offerState.error,
                    topBarTitle = "Limited Time Offer",
                    heroImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDmuQJ7nv39ovU8gqlpPbKwHBJ-BHzrG_G9_oWu2_QNeqcOdf9qDGl-fNWUnPyIHniOKHlD7Cb0BIFimkWTtQ6y7eutdo-4rkN4kuotoMViiiUoxydya8s81bZfiCORgFTjxH6h2Y4K3rGM1CqzDh3B2zAM41-trsrfebLdrgePYy5cVzj16WxBjHsh2ygaaPEWSp4klCA9AUQA_2R2WYc9wALmsU0sUJAQSB5WPapfkzfmaBJolwuUZ5GlLJyBu6xfEA8L5ZkFxOs",
                    heroBadgeText = "Exclusive Deal",
                    heroTitle = "Unlock Premium Features",
                    offerTitle = "50% OFF Annual Plan",
                    offerSubtitle = "The ultimate toolkit for rock & mineral identification.",
                    offerPrice = "$9.99",
                    offerPeriod = "/year",
                    offerOldPrice = realPrice ?: "$15.99",
                    ctaText = ctaText,
                    guaranteeText = guaranteeText
                ),
                onCloseClick = {
                    paywallTriggerManager.onOfferPaywallDismissed("offer_close")
                    navController.navigateBottomBarTo(Routes.MAIN)
                },
                onClaimOfferClick = {
                    paywallTriggerManager.onOfferPurchaseStarted("offer_paywall")
                    offerPaywallViewModel.purchaseSelectedPlan()
                },
                onRetryClick = { offerPaywallViewModel.loadOffer() }
            )
        }

        composable(Routes.PREMIUM_SUCCESS) {
            val premiumState by premiumSuccessViewModel.state.collectAsState()
            PremiumSuccessScreen(
                uiState = PremiumSuccessScreenUiState(
                    isLoading = premiumState.isLoading,
                    error = premiumState.error,
                    brandLabel = stringResource(id = com.izisoft.pp09base.R.string.premium_success_brand_label),
                    heroTitle = stringResource(id = com.izisoft.pp09base.R.string.premium_success_hero_title),
                    heroDescription = premiumState.premium?.message
                        ?.takeIf { it.isNotBlank() }
                        ?: stringResource(id = com.izisoft.pp09base.R.string.premium_success_hero_description),
                    unlockedFeatures = listOf(
                        com.izisoft.pp09base.features.premium_success.ui.component.PremiumFeatureUi(
                            iconName = "auto_awesome",
                            title = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_unlimited_title),
                            subtitle = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_unlimited_subtitle)
                        ),
                        com.izisoft.pp09base.features.premium_success.ui.component.PremiumFeatureUi(
                            iconName = "science",
                            title = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_science_title),
                            subtitle = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_science_subtitle)
                        ),
                        com.izisoft.pp09base.features.premium_success.ui.component.PremiumFeatureUi(
                            iconName = "location_on",
                            title = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_location_title),
                            subtitle = stringResource(id = com.izisoft.pp09base.R.string.premium_success_feature_location_subtitle)
                        )
                    ),
                    orderSummary = com.izisoft.pp09base.features.premium_success.ui.component.PremiumOrderSummaryUi(
                        planName = premiumState.purchasedPlanName
                            ?: DefaultPremiumOrderSummary.planName,
                        totalPrice = premiumState.purchasedPrice
                            ?: DefaultPremiumOrderSummary.totalPrice,
                        transactionId = premiumState.premium?.subscriptionId
                            ?.takeIf { it.isNotBlank() }
                            ?: DefaultPremiumOrderSummary.transactionId
                    ),
                    ctaText = stringResource(id = com.izisoft.pp09base.R.string.premium_success_cta),
                    receiptNote = stringResource(id = com.izisoft.pp09base.R.string.premium_success_receipt_note)
                ),
                onDoneClick = { navController.navigateBottomBarTo(Routes.MAIN) },
                onRetryClick = { premiumSuccessViewModel.load() }
            )
        }

        composable(Routes.PROFILE) {
            val profileState by profileViewModel.state.collectAsState()
            var unitMetricSelected by rememberSaveable { mutableStateOf(true) }
            var showLanguageDialog by rememberSaveable { mutableStateOf(false) }

            LaunchedEffect(profileState.selectedLanguageCode) {
                val localeTag = profileLanguageLocaleTag(profileState.selectedLanguageCode)
                applyAppLocale(rootContext, localeTag)
            }

            ProfileScreen(
                uiState = ProfileScreenUiState(
                    isLoading = profileState.isLoading,
                    error = profileState.error,
                    title = stringResource(id = R.string.profile_settings_title),
                    greeting = stringResource(id = R.string.profile_greeting),
                    isPremium = isPremium,
                    accountName = profileState.profile?.name ?: "Alex Sterling",
                    accountRole = stringResource(id = R.string.profile_account_role),
                    accountAvatarUrl = profileState.profile?.avatarUrl ?: DefaultProfileAvatarUrl,
                    syncProviders = DefaultProfileSyncProviders,
                    premiumTitle = stringResource(id = R.string.profile_premium_title),
                    premiumSubtitle = stringResource(id = R.string.profile_premium_subtitle),
                    languageLabel = profileLanguageLabelForUi(profileState.selectedLanguageCode),
                    versionText = stringResource(id = R.string.profile_version_text),
                    unitMetricSelected = unitMetricSelected
                ),
                onGoProClick = { if (!isPremium) navController.navigateSingleTopTo(Routes.SUBSCRIPTION_PAYWALL) },
                onProfileClick = { if (!isPremium) navController.navigateSingleTopTo(Routes.PROFILE_SUBSCRIPTION) },
                onSyncAccountsClick = { if (!isPremium) navController.navigateSingleTopTo(Routes.PROFILE_SUBSCRIPTION) },
                onPremiumClick = { if (!isPremium) navController.navigateSingleTopTo(Routes.PROFILE_SUBSCRIPTION) },
                onLanguageClick = { showLanguageDialog = true },
                onMetricClick = { unitMetricSelected = true },
                onImperialClick = { unitMetricSelected = false },
                onHelpCenterClick = { navController.navigateSingleTopTo(Routes.PROFILE_HELP_CENTER) },
                onPrivacyClick = { navController.navigateSingleTopTo(Routes.PROFILE_PRIVACY_POLICY) },
                onRestorePurchaseClick = { if (!isPremium) navController.navigateSingleTopTo(Routes.PROFILE_SUBSCRIPTION) },
                onRateAppClick = {
                    val currentActivity = rootActivity
                    if (currentActivity != null) {
                        rootScope.launch {
                            ratingManager.requestReviewOrOpenStore(
                                activity = currentActivity,
                                source = "settings"
                            )
                        }
                    } else {
                        ratingManager.launchStoreListing(rootContext)
                    }
                },
                onLogoutClick = {
                    appAnalytics.logAction("profile_logout_click")
                    profileViewModel.logout()
                    navController.navigate(Routes.ONBOARDING) {
                        popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
                        launchSingleTop = true
                    }
                },
                onRetryClick = { profileViewModel.load() }
            )

            if (showLanguageDialog) {
                LanguageSelectionDialog(
                    currentLanguage = profileState.selectedLanguageCode,
                    onLanguageSelected = { code ->
                        appAnalytics.logAction("profile_language_changed", mapOf("language" to code))
                        profileViewModel.updateLanguage(code)
                        showLanguageDialog = false
                    },
                    onDismiss = { showLanguageDialog = false }
                )
            }
        }

        composable(Routes.PROFILE_HELP_CENTER) {
            ProfileHelpCenterScreen(onBackClick = { navController.popBackStack() })
        }

        composable(Routes.PROFILE_PRIVACY_POLICY) {
            ProfilePrivacyPolicyScreen(onBackClick = { navController.popBackStack() })
        }

        composable(Routes.PROFILE_SUBSCRIPTION) {
            val profileSubscriptionState by profileSubscriptionViewModel.state.collectAsState()
            var selectedProfileSubscriptionBottomNavId by rememberSaveable { mutableStateOf("settings") }

            ProfileSubscriptionScreen(
                uiState = ProfileSubscriptionScreenUiState(
                    isLoading = profileSubscriptionState.isLoading,
                    error = profileSubscriptionState.error,
                    title = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_title),
                    brandName = stringResource(id = com.izisoft.pp09base.R.string.app_name),
                    currentPlanLabel = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_current_plan),
                    planName = profileSubscriptionState.subscription?.plan ?: stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_yearly_plan),
                    statusLabel = if (profileSubscriptionState.subscription?.isPremium == true) {
                        stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_active)
                    } else {
                        stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_inactive)
                    },
                    renewalLabel = profileSubscriptionState.subscription?.expiresAt?.let { stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_renews_on, it) }
                        ?: stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_renewal_unavailable),
                    priceLabel = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_price_label),
                    footerNote = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_footer_note),
                    benefits = listOf(
                        com.izisoft.pp09base.features.profile_subscription.ui.component.SubscriptionBenefitUi(
                            id = "unlimited_scans",
                            title = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_unlimited_title),
                            description = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_unlimited_desc),
                            iconName = "bolt"
                        ),
                        com.izisoft.pp09base.features.profile_subscription.ui.component.SubscriptionBenefitUi(
                            id = "advanced_history",
                            title = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_history_title),
                            description = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_history_desc),
                            iconName = "history_edu"
                        ),
                        com.izisoft.pp09base.features.profile_subscription.ui.component.SubscriptionBenefitUi(
                            id = "cloud_sync",
                            title = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_cloud_title),
                            description = stringResource(id = com.izisoft.pp09base.R.string.profile_subscription_benefit_cloud_desc),
                            iconName = "cloud_done"
                        )
                    ),
                    bottomNavItems = listOf(
                        com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionBottomNavItemUi(id = "home", label = stringResource(id = com.izisoft.pp09base.R.string.home_nav_home), iconName = "home"),
                        com.izisoft.pp09base.features.profile_subscription.ui.component.ProfileSubscriptionBottomNavItemUi(id = "settings", label = stringResource(id = com.izisoft.pp09base.R.string.home_nav_profile), iconName = "settings")
                    ),
                    selectedBottomNavId = selectedProfileSubscriptionBottomNavId
                ),
                onBackClick = { navController.popBackStack() },
                onManagePlanClick = { /* TODO: Open platform billing management */ },
                onRestorePurchaseClick = { /* TODO: Trigger purchase restore */ },
                onCancelSubscriptionClick = { /* TODO: Trigger cancellation flow */ },
                onBottomNavClick = { item ->
                    selectedProfileSubscriptionBottomNavId = item.id
                    when (item.id) {
                        "home" -> navController.navigateBottomBarTo(Routes.MAIN)
                        "settings" -> Unit
                    }
                },
                onRetryClick = { profileSubscriptionViewModel.load() }
            )
        }

        composable(Routes.OFFLINE_STATE) {
            OfflineStateScreen(
                uiState = OfflineStateScreenUiState(
                    title = stringResource(id = com.izisoft.pp09base.R.string.offline_title),
                    description = stringResource(id = com.izisoft.pp09base.R.string.offline_description),
                    tryAgainText = stringResource(id = com.izisoft.pp09base.R.string.offline_try_again),
                    checkSettingsText = stringResource(id = com.izisoft.pp09base.R.string.offline_check_settings),
                    errorCodeText = stringResource(id = com.izisoft.pp09base.R.string.offline_error_code),
                    watermarkText = stringResource(id = com.izisoft.pp09base.R.string.app_name)
                ),
                onTryAgainClick = {
                    if (isOnline) {
                        navController.popBackStack()
                    }
                },
                onCheckSettingsClick = { navController.navigateBottomBarTo(Routes.PROFILE) },
                onRetry = {
                    if (isOnline) {
                        navController.popBackStack()
                    }
                }
            )
        }

        composable(Routes.MAIN) {
            MainScreen(
                onOpenProfile = { navController.navigate(Routes.PROFILE) }
            )
        }
    }
}
