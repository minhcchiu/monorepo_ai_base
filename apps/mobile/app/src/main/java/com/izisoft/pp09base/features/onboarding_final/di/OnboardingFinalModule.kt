package com.izisoft.pp09base.features.onboarding_final.di

import com.izisoft.pp09base.features.onboarding_final.data.api.OnboardingFinalApi
import com.izisoft.pp09base.features.onboarding_final.data.repository.OnboardingFinalRepository
import com.izisoft.pp09base.features.onboarding_final.data.repository.OnboardingFinalRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object OnboardingFinalModule {
    @Provides
    @Singleton
    fun provideOnboardingFinalApi(retrofit: Retrofit): OnboardingFinalApi =
        retrofit.create(OnboardingFinalApi::class.java)

    @Provides
    @Singleton
    fun provideOnboardingFinalRepository(api: OnboardingFinalApi): OnboardingFinalRepository =
        OnboardingFinalRepositoryImpl(api)
}
