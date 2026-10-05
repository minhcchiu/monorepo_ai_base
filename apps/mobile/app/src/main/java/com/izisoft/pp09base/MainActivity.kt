package com.izisoft.pp09base

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.izisoft.pp09base.core.firebase.AppAnalytics
import com.izisoft.pp09base.core.network.NetworkMonitor
import com.izisoft.pp09base.core.theme.AppTheme
import com.izisoft.pp09base.features.login.logic.LoginViewModel
import com.izisoft.pp09base.features.offer_paywall.logic.OfferPaywallViewModel
import com.izisoft.pp09base.features.onboarding.logic.OnboardingViewModel
import com.izisoft.pp09base.features.onboarding1.logic.Onboarding1ViewModel
import com.izisoft.pp09base.features.onboarding_final.logic.OnboardingFinalViewModel
import com.izisoft.pp09base.features.paywall_trigger.logic.PaywallTriggerViewModel
import com.izisoft.pp09base.features.permission_request.logic.PermissionRequestViewModel
import com.izisoft.pp09base.features.premium_success.logic.PremiumSuccessViewModel
import com.izisoft.pp09base.features.profile.logic.ProfileViewModel
import com.izisoft.pp09base.features.profile_subscription.logic.ProfileSubscriptionViewModel
import com.izisoft.pp09base.features.register.logic.RegisterViewModel
import com.izisoft.pp09base.features.splash.logic.SplashViewModel
import com.izisoft.pp09base.features.subscription_paywall.logic.SubscriptionPaywallViewModel
import com.izisoft.pp09base.features.welcome.logic.WelcomeViewModel
import com.izisoft.pp09base.core.rating.RatingManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var networkMonitor: NetworkMonitor

    @Inject
    lateinit var appAnalytics: AppAnalytics

    @Inject
    lateinit var ratingManager: RatingManager

    @Inject
    lateinit var paywallTriggerManager: com.izisoft.pp09base.core.paywall.PaywallTriggerManager

    private val splashViewModel: SplashViewModel by viewModels()
    private val loginViewModel: LoginViewModel by viewModels()
    private val registerViewModel: RegisterViewModel by viewModels()
    private val onboardingViewModel: OnboardingViewModel by viewModels()
    private val onboarding1ViewModel: Onboarding1ViewModel by viewModels()
    private val onboardingFinalViewModel: OnboardingFinalViewModel by viewModels()
    private val permissionRequestViewModel: PermissionRequestViewModel by viewModels()
    private val subscriptionPaywallViewModel: SubscriptionPaywallViewModel by viewModels()
    private val welcomeViewModel: WelcomeViewModel by viewModels()
    private val paywallTriggerViewModel: PaywallTriggerViewModel by viewModels()
    private val premiumSuccessViewModel: PremiumSuccessViewModel by viewModels()
    private val profileViewModel: ProfileViewModel by viewModels()
    private val profileSubscriptionViewModel: ProfileSubscriptionViewModel by viewModels()
    private val offerPaywallViewModel: OfferPaywallViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        ratingManager.onAppOpened()
        setContent {
            val isOnline by networkMonitor.isOnline.collectAsState()

            AppTheme {
                AppNavigation(
                        isOnline = isOnline,
                        splashViewModel = splashViewModel,
                        loginViewModel = loginViewModel,
                        registerViewModel = registerViewModel,
                        onboardingViewModel = onboardingViewModel,
                        onboarding1ViewModel = onboarding1ViewModel,
                        onboardingFinalViewModel = onboardingFinalViewModel,
                        permissionRequestViewModel = permissionRequestViewModel,
                        subscriptionPaywallViewModel = subscriptionPaywallViewModel,
                        welcomeViewModel = welcomeViewModel,
                        paywallTriggerViewModel = paywallTriggerViewModel,
                        premiumSuccessViewModel = premiumSuccessViewModel,
                        profileViewModel = profileViewModel,
                        profileSubscriptionViewModel = profileSubscriptionViewModel,
                        offerPaywallViewModel = offerPaywallViewModel,
                        appAnalytics = appAnalytics,
                        ratingManager = ratingManager,
                        paywallTriggerManager = paywallTriggerManager
                )
            }
        }
    }
}
