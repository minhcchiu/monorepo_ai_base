package com.izisoft.pp09base.features.profile_subscription.data.repository

import com.izisoft.pp09base.features.profile_subscription.data.model.Subscription

interface ProfileSubscriptionRepository {
    suspend fun get(): Subscription
}
