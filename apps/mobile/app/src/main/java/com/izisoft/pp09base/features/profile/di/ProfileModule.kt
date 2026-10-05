package com.izisoft.pp09base.features.profile.di

import com.izisoft.pp09base.features.profile.data.api.ProfileApi
import com.izisoft.pp09base.features.profile.data.repository.ProfileRepository
import com.izisoft.pp09base.features.profile.data.repository.ProfileRepositoryImpl
import com.izisoft.pp09base.core.network.TokenStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ProfileModule {
    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): ProfileApi = retrofit.create(ProfileApi::class.java)

    @Provides
    @Singleton
    fun provideRepository(api: ProfileApi, tokenStore: TokenStore): ProfileRepository =
        ProfileRepositoryImpl(api, tokenStore)
}
