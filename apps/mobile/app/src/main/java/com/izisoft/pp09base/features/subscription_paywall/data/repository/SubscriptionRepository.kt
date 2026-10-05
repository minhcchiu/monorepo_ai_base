package com.izisoft.pp09base.features.subscription_paywall.data.repository

import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionProduct

interface SubscriptionRepository {
    suspend fun getProducts(): List<SubscriptionProduct>
    suspend fun purchaseProduct(productId: String): Boolean
    suspend fun restorePurchases(): Boolean
}
