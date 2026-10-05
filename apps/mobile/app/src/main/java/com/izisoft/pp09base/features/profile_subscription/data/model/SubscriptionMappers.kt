package com.izisoft.pp09base.features.profile_subscription.data.model

fun SubscriptionResponseDto.toDomain(): Subscription {
	val payload = data
	return Subscription(
		isPremium = payload?.isPremium ?: false,
		plan = payload?.plan,
		isTrial = payload?.isTrial ?: false,
		expiresAt = payload?.expiresAt,
		autoRenew = payload?.autoRenew ?: true,
		status = payload?.status
	)
}
