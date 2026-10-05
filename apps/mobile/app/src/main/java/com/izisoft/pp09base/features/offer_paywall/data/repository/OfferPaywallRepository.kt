package com.izisoft.pp09base.features.offer_paywall.data.repository

interface OfferPaywallRepository {
    suspend fun getOfferProductDetails(): Pair<String, String?>
    suspend fun purchaseOffer(productId: String): Boolean
    suspend fun restorePurchases(): Boolean
    suspend fun verifyPurchase(productId: String, purchaseToken: String): Boolean
}
