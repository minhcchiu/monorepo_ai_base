package com.izisoft.pp09base.features.offer_paywall.data.repository

import com.izisoft.pp09base.core.iap.GooglePlayBillingManager
import com.izisoft.pp09base.core.iap.IapConfig
import com.izisoft.pp09base.features.offer_paywall.data.api.OfferPaywallApi
import com.izisoft.pp09base.features.offer_paywall.data.api.OfferPaywallVerifyRequestDto
import java.io.IOException
import javax.inject.Inject
import retrofit2.HttpException

class OfferPaywallRepositoryImpl @Inject constructor(
    private val api: OfferPaywallApi,
    private val billingManager: GooglePlayBillingManager
) : OfferPaywallRepository {

    override suspend fun getOfferProductDetails(): Pair<String, String?> {
        return try {
            val product = billingManager.loadOfferProduct(IapConfig.yearlyOfferProductId)
            Pair(product?.price ?: "", product?.description)
        } catch (_: Exception) {
            Pair("", null)
        }
    }

    override suspend fun purchaseOffer(productId: String): Boolean {
        return try {
            val purchaseResult = billingManager.purchaseSubscription(productId) ?: return false
            val verified = verifyPurchase(
                productId = purchaseResult.productId.ifBlank { productId },
                purchaseToken = purchaseResult.purchaseToken
            )
            verified
        } catch (exception: HttpException) {
            throw Exception(parseHttpError(exception))
        } catch (exception: IOException) {
            throw Exception("Network error. Please check your connection.")
        } catch (exception: Exception) {
            throw Exception(exception.message ?: "Unable to complete purchase verification.")
        }
    }

    override suspend fun restorePurchases(): Boolean {
        return try {
            billingManager.restorePurchases()
        } catch (exception: Exception) {
            throw Exception(exception.message ?: "Unable to restore purchases.")
        }
    }

    override suspend fun verifyPurchase(productId: String, purchaseToken: String): Boolean {
        return try {
            api.verifyPurchase(
                OfferPaywallVerifyRequestDto(
                    platform = "ANDROID",
                    productId = productId,
                    purchaseToken = purchaseToken
                )
            ).success ?: true
        } catch (exception: HttpException) {
            throw Exception(parseHttpError(exception))
        } catch (_: IOException) {
            throw Exception("Network error. Please check your connection.")
        } catch (exception: Exception) {
            throw Exception(exception.message ?: "Unable to verify purchase.")
        }
    }

    private fun parseHttpError(exception: HttpException): String {
        return exception.response()?.errorBody()?.string()?.takeIf { it.isNotBlank() }
            ?: "Request failed (${exception.code()})."
    }
}
