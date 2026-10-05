package com.izisoft.pp09base.features.permission_request.ui.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp

@Composable
fun PermissionIconsVisual(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(192.dp),
        contentAlignment = Alignment.Center
    ) {
        // Decorative amber glow — requires API 31+ for hardware-accelerated blur
        Box(
            modifier = Modifier
                .size(220.dp)
                .blur(60.dp)
                .background(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                    shape = CircleShape
                )
        )

        // Dual overlapping icon boxes
        // Total width: 96 + 96 - 16 (overlap) = 176dp
        Box(
            modifier = Modifier
                .width(176.dp)
                .height(96.dp)
        ) {
            // Camera — behind, rotated -6°
            PermissionIconBox(
                icon = Icons.Filled.PhotoCamera,
                contentDescription = "Camera",
                rotationDeg = -6f,
                modifier = Modifier.align(Alignment.CenterStart)
            )
            // Gallery — in front, rotated +6°, offset to create 16dp overlap
            PermissionIconBox(
                icon = Icons.Filled.Image,
                contentDescription = "Photo gallery",
                rotationDeg = 6f,
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .offset(x = 80.dp)
            )
        }
    }
}

@Composable
private fun PermissionIconBox(
    icon: ImageVector,
    contentDescription: String,
    rotationDeg: Float,
    modifier: Modifier = Modifier
) {
    val deg = rotationDeg
    OutlinedCard(
        modifier = modifier
            .size(96.dp)
            .graphicsLayer { rotationZ = deg },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.outlinedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(48.dp)
            )
        }
    }
}
