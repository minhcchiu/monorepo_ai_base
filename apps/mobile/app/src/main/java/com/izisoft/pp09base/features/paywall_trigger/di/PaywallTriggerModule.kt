package com.izisoft.pp09base.features.paywall_trigger.di

import com.izisoft.pp09base.features.paywall_trigger.data.api.PaywallTriggerApi
import com.izisoft.pp09base.features.paywall_trigger.data.repository.PaywallTriggerRepository
import com.izisoft.pp09base.features.paywall_trigger.data.repository.PaywallTriggerRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object PaywallTriggerModule {
    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): PaywallTriggerApi = retrofit.create(PaywallTriggerApi::class.java)

    @Provides
    @Singleton
    fun provideRepository(api: PaywallTriggerApi): PaywallTriggerRepository = PaywallTriggerRepositoryImpl(api)
}
