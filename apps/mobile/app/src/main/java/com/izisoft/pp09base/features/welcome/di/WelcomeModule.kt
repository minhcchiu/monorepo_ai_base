package com.izisoft.pp09base.features.welcome.di

import com.izisoft.pp09base.features.welcome.data.api.WelcomeApi
import com.izisoft.pp09base.features.welcome.data.repository.WelcomeRepository
import com.izisoft.pp09base.features.welcome.data.repository.WelcomeRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object WelcomeModule {
    @Provides
    @Singleton
    fun provideWelcomeApi(retrofit: Retrofit): WelcomeApi = retrofit.create(WelcomeApi::class.java)

    @Provides
    @Singleton
    fun provideWelcomeRepository(api: WelcomeApi): WelcomeRepository = WelcomeRepositoryImpl(api)
}
