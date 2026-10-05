package com.izisoft.pp09base

import android.app.Activity
import android.app.Application
import com.google.android.gms.ads.MobileAds
import com.izisoft.pp09base.core.iap.AppActivityProvider
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class BaseApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        MobileAds.initialize(this)
        registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: android.os.Bundle?) = Unit

            override fun onActivityStarted(activity: Activity) = Unit

            override fun onActivityResumed(activity: Activity) {
                AppActivityProvider.currentActivity = activity
            }

            override fun onActivityPaused(activity: Activity) {
                if (AppActivityProvider.currentActivity === activity) {
                    AppActivityProvider.currentActivity = null
                }
            }

            override fun onActivityStopped(activity: Activity) = Unit

            override fun onActivitySaveInstanceState(activity: Activity, outState: android.os.Bundle) = Unit

            override fun onActivityDestroyed(activity: Activity) {
                if (AppActivityProvider.currentActivity === activity) {
                    AppActivityProvider.currentActivity = null
                }
            }
        })
    }
}
