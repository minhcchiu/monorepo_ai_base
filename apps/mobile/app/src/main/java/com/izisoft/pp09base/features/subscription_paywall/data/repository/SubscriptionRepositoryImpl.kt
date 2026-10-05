package com.izisoft.pp09base.features.subscription_paywall.data.repository

import com.izisoft.pp09base.core.iap.GooglePlayBillingManager
import com.izisoft.pp09base.features.subscription_paywall.data.api.SubscriptionApi
import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionProduct
import com.izisoft.pp09base.features.subscription_paywall.data.model.SubscriptionVerifyRequestDto
import com.izisoft.pp09base.features.subscription_paywall.data.model.toDomain
import java.io.IOException
import javax.inject.Inject
import retrofit2.HttpException

class SubscriptionRepositoryImpl @Inject constructor(
    private val billingManager: GooglePlayBillingManager,
    private val subscriptionApi: SubscriptionApi
) : SubscriptionRepository {
    override suspend fun getProducts(): List<SubscriptionProduct> {
        return billingManager.loadSubscriptionProducts().map { product ->
            SubscriptionProduct(
                id = product.productId,
                name = product.title,
                price = product.price,
                description = product.description,
                billingPeriod = product.billingPeriod
            )
        }
    }

    override suspend fun purchaseProduct(productId: String): Boolean {
        return try {
            val purchaseResult = billingManager.purchaseSubscription(productId) ?: return false
            val verifyResponse = subscriptionApi.verifySubscription(
                SubscriptionVerifyRequestDto(
                    platform = "ANDROID",
                    productId = purchaseResult.productId.ifBlank { productId },
                    purchaseToken = purchaseResult.purchaseToken
                )
            )
            verifyResponse.toDomain().isVerified
        } catch (exception: HttpException) {
            throw Exception(parseHttpError(exception))
        } catch (exception: IOException) {
            throw Exception("Network error. Please check your connection.")
        } catch (exception: Exception) {
            throw Exception(exception.message ?: "Unable to complete subscription verification.")
        }
    }

    override suspend fun restorePurchases(): Boolean {
        return billingManager.restorePurchases()
    }

    private fun parseHttpError(exception: HttpException): String {
        return exception.response()?.errorBody()?.string()
            ?.takeIf { it.isNotBlank() }
            ?: "Subscription verification failed (${exception.code()})."
    }
}
