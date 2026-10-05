package com.izisoft.pp09base.features.subscription_paywall.di

import com.izisoft.pp09base.features.subscription_paywall.data.api.SubscriptionApi
import com.izisoft.pp09base.features.subscription_paywall.data.repository.SubscriptionRepository
import com.izisoft.pp09base.features.subscription_paywall.data.repository.SubscriptionRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SubscriptionModule {
    @Provides
    @Singleton
    fun provideSubscriptionApi(retrofit: Retrofit): SubscriptionApi =
        retrofit.create(SubscriptionApi::class.java)

    @Provides
    @Singleton
    fun provideSubscriptionRepository(repository: SubscriptionRepositoryImpl): SubscriptionRepository =
        repository
}
