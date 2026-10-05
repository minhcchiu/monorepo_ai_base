package com.izisoft.pp09base.core.rating

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.google.android.play.core.review.ReviewManagerFactory
import com.izisoft.pp09base.core.firebase.AppAnalytics
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

private const val THIRTY_DAYS_MILLIS = 30L * 24L * 60L * 60L * 1000L

data class RatingCounters(
    val scanCount: Int,
    val successfulScanCount: Int,
    val appOpenCount: Int
)

@Singleton
class RatingManager @Inject constructor(
    private val ratingPrefs: RatingPrefs,
    private val analytics: AppAnalytics,
    @ApplicationContext private val appContext: Context
) {

    fun onAppOpened() {
        ratingPrefs.incrementAppOpenCount()
    }

    fun onScanResultShown(success: Boolean) {
        ratingPrefs.incrementScanCount()
        if (success) {
            ratingPrefs.incrementSuccessfulScanCount()
        }
    }

    fun getCounters(): RatingCounters {
        return RatingCounters(
            scanCount = ratingPrefs.getScanCount(),
            successfulScanCount = ratingPrefs.getSuccessfulScanCount(),
            appOpenCount = ratingPrefs.getAppOpenCount()
        )
    }

    fun shouldShowRatingPrompt(
        source: String,
        isAdShowing: Boolean,
        isPaywallShowing: Boolean,
        isScanResultSuccessful: Boolean
    ): Boolean {
        val counters = getCounters()
        val lastAskTime = ratingPrefs.getLastReviewAskTime()
        val now = System.currentTimeMillis()
        val canAskByTime = lastAskTime == 0L || now - lastAskTime >= THIRTY_DAYS_MILLIS

        val eligible = counters.scanCount >= 3 &&
            counters.successfulScanCount >= 2 &&
            counters.appOpenCount >= 2 &&
            canAskByTime &&
            !isAdShowing &&
            !isPaywallShowing &&
            isScanResultSuccessful &&
            !ratingPrefs.hasUserSelectedHighRating() &&
            !ratingPrefs.hasUserSubmittedFeedback()

        if (eligible) {
            analytics.logAction(
                "rating_prompt_shown",
                mapOf(
                    "source" to source,
                    "scan_count" to counters.scanCount,
                    "app_open_count" to counters.appOpenCount
                )
            )
        }

        return eligible
    }

    fun onPromptDismissed(source: String) {
        ratingPrefs.updateLastReviewAskTime()
        val counters = getCounters()
        analytics.logAction(
            "rating_prompt_dismissed",
            mapOf(
                "source" to source,
                "scan_count" to counters.scanCount,
                "app_open_count" to counters.appOpenCount
            )
        )
    }

    suspend fun onStarSelected(
        activity: Activity,
        source: String,
        starCount: Int
    ): Boolean {
        ratingPrefs.updateLastReviewAskTime()

        val counters = getCounters()
        analytics.logAction(
            "rating_star_selected",
            mapOf(
                "source" to source,
                "star_count" to starCount,
                "scan_count" to counters.scanCount,
                "app_open_count" to counters.appOpenCount
            )
        )

        if (starCount >= 4) {
            ratingPrefs.setUserSelectedHighRating(true)
            return requestInAppReview(activity = activity, source = source)
        }

        return false
    }

    suspend fun requestInAppReview(activity: Activity, source: String): Boolean {
        return try {
            val manager = ReviewManagerFactory.create(activity)
            val requestTask = manager.requestReviewFlow()
            val reviewInfo = suspendCancellableCoroutine<com.google.android.play.core.review.ReviewInfo?> { cont ->
                requestTask
                    .addOnCompleteListener { task ->
                        cont.resume(if (task.isSuccessful) task.result else null)
                    }
            }

            if (reviewInfo == null) {
                false
            } else {
                analytics.logAction("in_app_review_requested", mapOf("source" to source))
                val launchTask = manager.launchReviewFlow(activity, reviewInfo)
                suspendCancellableCoroutine { cont ->
                    launchTask.addOnCompleteListener { cont.resume(Unit) }
                }
                true
            }
        } catch (_: Exception) {
            false
        }
    }

    fun onFeedbackDialogShown(source: String) {
        analytics.logAction("feedback_dialog_shown", mapOf("source" to source))
    }

    fun onFeedbackSubmitted(source: String, feedbackReason: String, stars: Int) {
        ratingPrefs.setUserSubmittedFeedback(true)
        val counters = getCounters()
        analytics.logAction(
            "feedback_submitted",
            mapOf(
                "source" to source,
                "feedback_reason" to feedbackReason,
                "star_count" to stars,
                "scan_count" to counters.scanCount,
                "app_open_count" to counters.appOpenCount
            )
        )
    }

    fun launchStoreListing(context: Context = appContext) {
        val packageName = context.packageName
        val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$packageName")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching {
            context.startActivity(marketIntent)
        }.onFailure {
            val webIntent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
        }
    }

    suspend fun requestReviewOrOpenStore(activity: Activity, source: String) {
        val launched = requestInAppReview(activity = activity, source = source)
        if (!launched) {
            launchStoreListing(activity)
        }
    }
}
