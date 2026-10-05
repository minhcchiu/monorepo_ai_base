package com.izisoft.pp09base.features.onboarding1.di

import com.izisoft.pp09base.features.onboarding1.data.api.Onboarding1Api
import com.izisoft.pp09base.features.onboarding1.data.repository.Onboarding1Repository
import com.izisoft.pp09base.features.onboarding1.data.repository.Onboarding1RepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object Onboarding1Module {
    @Provides
    @Singleton
    fun provideOnboarding1Api(retrofit: Retrofit): Onboarding1Api =
        retrofit.create(Onboarding1Api::class.java)

    @Provides
    @Singleton
    fun provideOnboarding1Repository(api: Onboarding1Api): Onboarding1Repository =
        Onboarding1RepositoryImpl(api)
}
