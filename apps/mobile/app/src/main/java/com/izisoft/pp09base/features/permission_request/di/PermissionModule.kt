package com.izisoft.pp09base.features.permission_request.di

import com.izisoft.pp09base.features.permission_request.data.api.PermissionApi
import com.izisoft.pp09base.features.permission_request.data.repository.PermissionRepository
import com.izisoft.pp09base.features.permission_request.data.repository.PermissionRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object PermissionModule {
    @Provides
    @Singleton
    fun providePermissionApi(retrofit: Retrofit): PermissionApi =
        retrofit.create(PermissionApi::class.java)

    @Provides
    @Singleton
    fun providePermissionRepository(api: PermissionApi): PermissionRepository =
        PermissionRepositoryImpl(api)
}
