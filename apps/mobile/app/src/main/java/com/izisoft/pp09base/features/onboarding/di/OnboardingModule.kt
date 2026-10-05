package com.izisoft.pp09base.features.onboarding.di

import com.izisoft.pp09base.features.onboarding.data.api.OnboardingApi
import com.izisoft.pp09base.features.onboarding.data.repository.OnboardingRepository
import com.izisoft.pp09base.features.onboarding.data.repository.OnboardingRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object OnboardingModule {
    @Provides
    @Singleton
    fun provideOnboardingApi(retrofit: Retrofit): OnboardingApi =
        retrofit.create(OnboardingApi::class.java)

    @Provides
    @Singleton
    fun provideOnboardingRepository(api: OnboardingApi): OnboardingRepository =
        OnboardingRepositoryImpl(api)
}
