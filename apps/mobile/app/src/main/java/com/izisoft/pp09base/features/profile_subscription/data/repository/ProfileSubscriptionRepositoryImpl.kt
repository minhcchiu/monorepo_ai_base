package com.izisoft.pp09base.features.profile_subscription.data.repository

import com.izisoft.pp09base.features.profile_subscription.data.api.ProfileSubscriptionApi
import com.izisoft.pp09base.features.profile_subscription.data.model.Subscription
import com.izisoft.pp09base.features.profile_subscription.data.model.toDomain

class ProfileSubscriptionRepositoryImpl(private val api: ProfileSubscriptionApi) : ProfileSubscriptionRepository {
    override suspend fun get(): Subscription {
        val dto = api.getSubscription()
        return dto.toDomain()
    }
}
