package com.izisoft.pp09base.features.premium_success.di

import com.izisoft.pp09base.features.premium_success.data.api.PremiumSuccessApi
import com.izisoft.pp09base.features.premium_success.data.repository.PremiumSuccessRepository
import com.izisoft.pp09base.features.premium_success.data.repository.PremiumSuccessRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object PremiumSuccessModule {
    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): PremiumSuccessApi = retrofit.create(PremiumSuccessApi::class.java)

    @Provides
    @Singleton
    fun provideRepo(api: PremiumSuccessApi): PremiumSuccessRepository = PremiumSuccessRepositoryImpl(api)
}
