package com.izisoft.pp09base.features.onboarding.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage

@Composable
fun OnboardingHeroImage(
    imageUrl: String?,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center
    ) {
        // TODO: replace with a real local asset when available
        AsyncImage(
            model = imageUrl,
            contentDescription = "Onboarding hero image",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // HUD scanning overlay
        OnboardingHudOverlay(
            modifier = Modifier
                .fillMaxSize(0.8f)
                .align(Alignment.Center)
        )
    }
}

@Composable
fun OnboardingHudOverlay(modifier: Modifier = Modifier) {
    val gold = MaterialTheme.colorScheme.primary
    Box(
        modifier = modifier.drawWithCache {
            val strokeWidth = 4.dp.toPx()
            val bracketLen = 32.dp.toPx()
            onDrawBehind {
                // Top-left
                drawLine(gold, Offset(0f, 0f), Offset(bracketLen, 0f), strokeWidth, StrokeCap.Square)
                drawLine(gold, Offset(0f, 0f), Offset(0f, bracketLen), strokeWidth, StrokeCap.Square)
                // Top-right
                drawLine(gold, Offset(size.width, 0f), Offset(size.width - bracketLen, 0f), strokeWidth, StrokeCap.Square)
                drawLine(gold, Offset(size.width, 0f), Offset(size.width, bracketLen), strokeWidth, StrokeCap.Square)
                // Bottom-left
                drawLine(gold, Offset(0f, size.height), Offset(bracketLen, size.height), strokeWidth, StrokeCap.Square)
                drawLine(gold, Offset(0f, size.height), Offset(0f, size.height - bracketLen), strokeWidth, StrokeCap.Square)
                // Bottom-right
                drawLine(gold, Offset(size.width, size.height), Offset(size.width - bracketLen, size.height), strokeWidth, StrokeCap.Square)
                drawLine(gold, Offset(size.width, size.height), Offset(size.width, size.height - bracketLen), strokeWidth, StrokeCap.Square)
            }
        }
    ) {
        // Scan line
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(2.dp)
                .align(Alignment.Center)
                .background(gold.copy(alpha = 0.6f))
        )
    }
}
