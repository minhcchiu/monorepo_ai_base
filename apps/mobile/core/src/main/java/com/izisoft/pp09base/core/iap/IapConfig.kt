package com.izisoft.pp09base.core.iap

object IapConfig {
    object Test {
        const val WEEKLY = "sub_weekly"
        const val YEARLY = "sub_yearly"
    }

    object Prod {
        const val WEEKLY = "sub_weekly"
        const val YEARLY = "sub_yearly"
        const val YEARLY_OFFER = "sub_yearly_offer"
    }

    private const val USE_TEST_PRODUCTS = false

    val weeklyProductId: String
        get() = if (USE_TEST_PRODUCTS) Test.WEEKLY else Prod.WEEKLY

    val yearlyProductId: String
        get() = if (USE_TEST_PRODUCTS) Test.YEARLY else Prod.YEARLY

    val yearlyOfferProductId: String
        get() = Prod.YEARLY_OFFER

    val subscriptionProductIds: List<String>
        get() = listOf(weeklyProductId, yearlyProductId)
}
