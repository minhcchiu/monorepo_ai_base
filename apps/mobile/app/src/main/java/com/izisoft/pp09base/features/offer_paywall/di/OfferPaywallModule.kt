package com.izisoft.pp09base.features.offer_paywall.di

import com.izisoft.pp09base.features.offer_paywall.data.api.OfferPaywallApi
import com.izisoft.pp09base.features.offer_paywall.data.repository.OfferPaywallRepository
import com.izisoft.pp09base.features.offer_paywall.data.repository.OfferPaywallRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
object OfferPaywallModule {

    @Provides
    @Singleton
    fun provideOfferPaywallApi(retrofit: Retrofit): OfferPaywallApi {
        return retrofit.create(OfferPaywallApi::class.java)
    }

    @Provides
    @Singleton
    fun provideOfferPaywallRepository(
        repositoryImpl: OfferPaywallRepositoryImpl
    ): OfferPaywallRepository {
        return repositoryImpl
    }
}
