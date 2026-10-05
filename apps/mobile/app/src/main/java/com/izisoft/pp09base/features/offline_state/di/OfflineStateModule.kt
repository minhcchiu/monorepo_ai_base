package com.izisoft.pp09base.features.offline_state.di

import com.izisoft.pp09base.features.offline_state.data.api.OfflineStateApi
import com.izisoft.pp09base.features.offline_state.data.repository.OfflineStateRepository
import com.izisoft.pp09base.features.offline_state.data.repository.OfflineStateRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object OfflineStateModule {
    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): OfflineStateApi = retrofit.create(OfflineStateApi::class.java)

    @Provides
    @Singleton
    fun provideRepository(api: OfflineStateApi): OfflineStateRepository = OfflineStateRepositoryImpl(api)
}
