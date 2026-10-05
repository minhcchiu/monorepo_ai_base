package com.izisoft.pp09base.core.iap

import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.izisoft.pp09base.core.firebase.AppAnalytics
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine

@Singleton
class GooglePlayBillingManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val appAnalytics: AppAnalytics
) : PurchasesUpdatedListener {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val billingClient: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    private val cachedProductDetails = linkedMapOf<String, ProductDetails>()
    private var purchaseContinuation: kotlin.coroutines.Continuation<GooglePlayPurchaseResult?>? = null
    private val loggedPurchaseTokens = java.util.Collections.synchronizedSet(mutableSetOf<String>())

    suspend fun loadSubscriptionProducts(): List<GooglePlaySubscriptionProduct> {
        ensureConnected()
        val productDetails = queryProductDetails(IapConfig.subscriptionProductIds)
        productDetails.forEach { cachedProductDetails[it.productId] = it }

        return IapConfig.subscriptionProductIds.mapNotNull { productId ->
            productDetails.firstOrNull { it.productId == productId }?.toDomain()
        }
    }

    suspend fun loadOfferProduct(productId: String): GooglePlaySubscriptionProduct? {
        ensureConnected()
        val cached = cachedProductDetails[productId]
        val details = if (cached != null) listOf(cached) else {
            val fetched = queryProductDetails(listOf(productId))
            fetched.forEach { cachedProductDetails[it.productId] = it }
            fetched
        }
        return details.firstOrNull()?.toDomain()
    }

    suspend fun purchaseSubscription(productId: String): GooglePlayPurchaseResult? {
        appAnalytics.logAction("iap_purchase_started", mapOf("product_id" to productId))
        ensureConnected()
        val productDetails = cachedProductDetails[productId]
            ?: queryProductDetails(listOf(productId)).firstOrNull()?.also {
                cachedProductDetails[productId] = it
            }
            ?: throw Exception("Subscription product not found in Google Play.")

        val selectedOffer = productDetails.selectPreferredOffer()
        val chosenOffer = selectedOffer
            ?: throw Exception("No subscription offer available for this product.")
        val offerToken = chosenOffer.offerToken

        val activity = AppActivityProvider.currentActivity
            ?: throw Exception("No active activity available for purchase.")

        return suspendCancellableCoroutine { continuation ->
            purchaseContinuation = continuation

            val params = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()

            val billingResult = billingClient.launchBillingFlow(
                activity,
                BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(params))
                    .build()
            )

            if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                purchaseContinuation = null
                if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
                    appAnalytics.logAction("iap_purchase_canceled", mapOf("product_id" to productId))
                    continuation.resume(null)
                } else {
                    appAnalytics.logAction(
                        "iap_purchase_failed",
                        mapOf(
                            "product_id" to productId,
                            "response_code" to billingResult.responseCode,
                            "debug_message" to resolveBillingMessage(billingResult)
                        )
                    )
                    continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
                }
            }
        }
    }

    suspend fun restorePurchases(): Boolean {
        ensureConnected()
        val purchases = queryPurchases()
        val purchasedItems = purchases.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        if (purchasedItems.isEmpty()) {
            appAnalytics.logAction("iap_restore_no_purchase")
            return false
        }

        purchasedItems.forEach { acknowledgeIfNeeded(it) }
        appAnalytics.logAction("iap_restore_success", mapOf("count" to purchasedItems.size))
        return true
    }

    override fun onPurchasesUpdated(
        billingResult: BillingResult,
        purchases: MutableList<Purchase>?
    ) {
        val continuation = purchaseContinuation ?: return

        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val purchase = purchases
                    ?.firstOrNull { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                if (purchase == null) {
                    purchaseContinuation = null
                    appAnalytics.logAction("iap_purchase_missing_purchase")
                    continuation.resume(null)
                    return
                }

                // Xoá ngay (đồng bộ) để các callback trùng từ Google Play
                // bị chặn ở `purchaseContinuation ?: return` phía trên,
                // tránh xử lý / log iap_purchase_success nhiều lần.
                purchaseContinuation = null
                handleCompletedPurchase(purchase, continuation)
            }

            BillingClient.BillingResponseCode.USER_CANCELED -> {
                purchaseContinuation = null
                appAnalytics.logAction("iap_purchase_canceled")
                continuation.resume(null)
            }

            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                // Người dùng đã sở hữu gói (hay gặp khi test lại hoặc cài lại app).
                // Coi như thành công: truy vấn lại gói đang sở hữu để acknowledge + log.
                purchaseContinuation = null
                handleAlreadyOwned(continuation)
            }

            else -> {
                purchaseContinuation = null
                appAnalytics.logAction(
                    "iap_purchase_failed",
                    mapOf(
                        "response_code" to billingResult.responseCode,
                        "debug_message" to resolveBillingMessage(billingResult)
                    )
                )
                continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
            }
        }
    }

    private fun handleCompletedPurchase(
        purchase: Purchase,
        continuation: kotlin.coroutines.Continuation<GooglePlayPurchaseResult?>
    ) {
        scope.launch {
            runCatching {
                completePurchase(purchase, continuation)
            }.onFailure {
                continuation.resumeWithException(it)
            }
        }
    }

    private fun handleAlreadyOwned(
        continuation: kotlin.coroutines.Continuation<GooglePlayPurchaseResult?>
    ) {
        scope.launch {
            runCatching {
                val owned = queryPurchases()
                    .firstOrNull { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    ?: throw Exception("Item already owned but no active purchase found.")
                completePurchase(owned, continuation)
            }.onFailure {
                appAnalytics.logAction(
                    "iap_purchase_failed",
                    mapOf(
                        "response_code" to BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED,
                        "debug_message" to (it.message ?: "Item already owned.")
                    )
                )
                continuation.resumeWithException(it)
            }
        }
    }

    private suspend fun completePurchase(
        purchase: Purchase,
        continuation: kotlin.coroutines.Continuation<GooglePlayPurchaseResult?>
    ) {
        acknowledgeIfNeeded(purchase)
        val purchasedProductId = purchase.products.firstOrNull().orEmpty()
        // Chỉ log một lần cho mỗi giao dịch, kể cả khi Google Play
        // giao callback trùng hoặc giao dịch về lại ở lần mở app sau.
        if (loggedPurchaseTokens.add(purchase.purchaseToken)) {
            appAnalytics.logAction(
                "iap_purchase_success",
                mapOf("product_id" to purchasedProductId) + priceParamsFor(purchasedProductId)
            )
        }
        continuation.resume(
            GooglePlayPurchaseResult(
                productId = purchasedProductId,
                purchaseToken = purchase.purchaseToken
            )
        )
    }

    private suspend fun ensureConnected() {
        if (billingClient.isReady) return

        suspendCancellableCoroutine<Unit> { continuation ->
            billingClient.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(billingResult: BillingResult) {
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        continuation.resume(Unit)
                    } else {
                        continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
                    }
                }

                override fun onBillingServiceDisconnected() = Unit
            })
        }
    }

    private suspend fun queryProductDetails(productIds: List<String>): List<ProductDetails> {
        return suspendCancellableCoroutine { continuation ->
            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(
                    productIds.map { productId ->
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    }
                )
                .build()

            billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    continuation.resume(productDetailsList)
                } else {
                    continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
                }
            }
        }
    }

    private suspend fun queryPurchases(): List<Purchase> {
        return suspendCancellableCoroutine { continuation ->
            billingClient.queryPurchasesAsync(
                QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            ) { billingResult, purchasesList ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    continuation.resume(purchasesList)
                } else {
                    continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
                }
            }
        }
    }

    private suspend fun acknowledgeIfNeeded(purchase: Purchase) {
        if (purchase.isAcknowledged) return

        suspendCancellableCoroutine<Unit> { continuation ->
            billingClient.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
            ) { billingResult ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    continuation.resume(Unit)
                } else {
                    continuation.resumeWithException(Exception(resolveBillingMessage(billingResult)))
                }
            }
        }
    }

    /**
     * Lấy giá trị đơn hàng để gửi kèm event mua hàng theo chuẩn GA4:
     *  - "value": giá định kỳ (đã quy đổi từ micros sang đơn vị chính, vd 4.99)
     *  - "currency": mã tiền tệ ISO 4217 (vd "USD")
     * Trả về map rỗng nếu không lấy được giá (event vẫn log với product_id).
     */
    private suspend fun priceParamsFor(productId: String): Map<String, Any> {
        if (productId.isEmpty()) return emptyMap()

        val details = cachedProductDetails[productId]
            ?: runCatching { queryProductDetails(listOf(productId)).firstOrNull() }
                .getOrNull()
                ?.also { cachedProductDetails[productId] = it }
            ?: return emptyMap()

        val basePricePhase = details.selectPreferredOffer()
            ?.pricingPhases
            ?.pricingPhaseList
            ?.lastOrNull { it.priceAmountMicros > 0L }
            ?: return emptyMap()

        return mapOf(
            "value" to basePricePhase.priceAmountMicros / 1_000_000.0,
            "currency" to basePricePhase.priceCurrencyCode
        )
    }

    private fun ProductDetails.toDomain(): GooglePlaySubscriptionProduct {
        val selectedOffer = selectPreferredOffer()
        val pricingPhases = selectedOffer?.pricingPhases?.pricingPhaseList.orEmpty()
        val basePricePhase = pricingPhases.lastOrNull { it.priceAmountMicros > 0L }
            ?: pricingPhases.lastOrNull()
        val trialPhase = pricingPhases.firstOrNull { it.isFreeTrialPhase() }

        val descriptionWithTrial = if (trialPhase != null && basePricePhase != null) {
            "${formatTrialPeriod(trialPhase.billingPeriod)} free, then ${basePricePhase.formattedPrice}/${formatBillingPeriod(basePricePhase.billingPeriod)}"
        } else {
            description
        }

        return GooglePlaySubscriptionProduct(
            productId = productId,
            title = title.substringBefore(" ("),
            price = basePricePhase?.formattedPrice ?: "",
            description = descriptionWithTrial,
            billingPeriod = basePricePhase?.billingPeriod.orEmpty()
        )
    }

    private fun ProductDetails.selectPreferredOffer(): ProductDetails.SubscriptionOfferDetails? {
        val offers = subscriptionOfferDetails.orEmpty()
        if (offers.isEmpty()) return null

        return offers.firstOrNull { offer ->
            offer.pricingPhases.pricingPhaseList.any { phase -> phase.isFreeTrialPhase() }
        } ?: offers.firstOrNull()
    }

    private fun ProductDetails.PricingPhase.isFreeTrialPhase(): Boolean {
        return priceAmountMicros == 0L
    }

    private fun formatTrialPeriod(billingPeriod: String): String {
        return when {
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("D", ignoreCase = true) -> {
                val days = billingPeriod.removePrefix("P").removeSuffix("D")
                if (days == "1") "1 day trial" else "${days} days trial"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("W", ignoreCase = true) -> {
                val weeks = billingPeriod.removePrefix("P").removeSuffix("W")
                if (weeks == "1") "1 week trial" else "${weeks} weeks trial"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("M", ignoreCase = true) -> {
                val months = billingPeriod.removePrefix("P").removeSuffix("M")
                if (months == "1") "1 month trial" else "${months} months trial"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("Y", ignoreCase = true) -> {
                val years = billingPeriod.removePrefix("P").removeSuffix("Y")
                if (years == "1") "1 year trial" else "${years} years trial"
            }
            else -> "Free trial"
        }
    }

    private fun formatBillingPeriod(billingPeriod: String): String {
        return when {
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("D", ignoreCase = true) -> {
                val days = billingPeriod.removePrefix("P").removeSuffix("D")
                if (days == "1") "day" else "${days}d"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("W", ignoreCase = true) -> {
                val weeks = billingPeriod.removePrefix("P").removeSuffix("W")
                if (weeks == "1") "week" else "${weeks}w"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("M", ignoreCase = true) -> {
                val months = billingPeriod.removePrefix("P").removeSuffix("M")
                if (months == "1") "month" else "${months}m"
            }
            billingPeriod.startsWith("P", ignoreCase = true) && billingPeriod.endsWith("Y", ignoreCase = true) -> {
                val years = billingPeriod.removePrefix("P").removeSuffix("Y")
                if (years == "1") "year" else "${years}y"
            }
            else -> "period"
        }
    }

    private fun resolveBillingMessage(billingResult: BillingResult): String {
        return billingResult.debugMessage.takeIf { it.isNotBlank() }
            ?: "Google Play Billing request failed."
    }
}

data class GooglePlaySubscriptionProduct(
    val productId: String,
    val title: String,
    val price: String,
    val description: String,
    val billingPeriod: String
)

data class GooglePlayPurchaseResult(
    val productId: String,
    val purchaseToken: String
)
