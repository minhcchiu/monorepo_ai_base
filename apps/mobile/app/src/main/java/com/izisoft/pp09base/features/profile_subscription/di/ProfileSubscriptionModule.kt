package com.izisoft.pp09base.features.profile_subscription.di

import com.izisoft.pp09base.features.profile_subscription.data.api.ProfileSubscriptionApi
import com.izisoft.pp09base.features.profile_subscription.data.repository.ProfileSubscriptionRepository
import com.izisoft.pp09base.features.profile_subscription.data.repository.ProfileSubscriptionRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ProfileSubscriptionModule {
    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): ProfileSubscriptionApi = retrofit.create(ProfileSubscriptionApi::class.java)

    @Provides
    @Singleton
    fun provideRepository(api: ProfileSubscriptionApi): ProfileSubscriptionRepository = ProfileSubscriptionRepositoryImpl(api)
}
