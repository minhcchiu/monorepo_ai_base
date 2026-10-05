package com.izisoft.pp09base.features.splash.data.repository

import android.content.Context
import com.izisoft.pp09base.core.ads.PremiumStatusManager
import com.izisoft.pp09base.core.network.TokenStore
import com.izisoft.pp09base.features.splash.data.api.SplashApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SplashModule {

    @Provides
    @Singleton
    fun provideSplashApi(retrofit: Retrofit): SplashApi {
        return retrofit.create(SplashApi::class.java)
    }

    @Provides
    @Singleton
    fun provideSplashRepository(
        splashApi: SplashApi,
        @ApplicationContext context: Context,
        tokenStore: TokenStore,
        premiumStatusManager: PremiumStatusManager
    ): SplashRepository {
        return SplashRepository(splashApi, context, tokenStore, premiumStatusManager)
    }
}
