package com.izisoft.pp09base.features.permission_request.ui.screen

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.izisoft.pp09base.features.permission_request.logic.PermissionRequestViewModel
import com.izisoft.pp09base.features.permission_request.ui.component.PermissionActionButtons
import com.izisoft.pp09base.features.permission_request.ui.component.PermissionIconsVisual
import com.izisoft.pp09base.features.permission_request.ui.component.PermissionPrivacyNote
import com.izisoft.pp09base.features.permission_request.ui.component.PermissionTopAppBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionRequestScreen(
    viewModel: PermissionRequestViewModel,
    onBackClick: () -> Unit,
    onSkipClick: () -> Unit,
    onAllowAccessClick: () -> Unit,
    onMaybeLaterClick: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        viewModel.onCameraPermissionResult(granted)
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        viewModel.onNotificationPermissionResult(granted)
        if (state.isPermissionGranted) {
            onAllowAccessClick()
        }
    }

    LaunchedEffect(state.shouldRequestCameraPermission) {
        if (state.shouldRequestCameraPermission) {
            val alreadyGranted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED

            if (alreadyGranted) {
                viewModel.onCameraPermissionResult(true)
            } else {
                permissionLauncher.launch(Manifest.permission.CAMERA)
            }
            viewModel.onCameraPermissionRequestConsumed()
        }
    }

    LaunchedEffect(state.shouldRequestNotificationPermission) {
        if (state.shouldRequestNotificationPermission) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val notificationGranted = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED

                if (notificationGranted) {
                    viewModel.onNotificationPermissionResult(true)
                    if (state.isPermissionGranted) {
                        onAllowAccessClick()
                    }
                } else {
                    notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            } else {
                viewModel.onNotificationPermissionResult(true)
                if (state.isPermissionGranted) {
                    onAllowAccessClick()
                }
            }
            viewModel.onNotificationPermissionRequestConsumed()
        }
    }

    Scaffold(
        topBar = {
            PermissionTopAppBar(
                onBackClick = onBackClick,
                onSkipClick = onSkipClick
            )
        },
        containerColor = MaterialTheme.colorScheme.surface
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Subtle decorative background blobs
            PermissionBackgroundDecor()

            when {
                state.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                state.error != null -> {
                    Column(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = state.error ?: stringResource(id = com.izisoft.pp09base.R.string.unknown_error),
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadRationale() }) {
                            Text(stringResource(id = com.izisoft.pp09base.R.string.retry))
                        }
                    }
                }
                else -> {
                    PermissionMainContent(
                        onAllowAccessClick = { viewModel.onRequestPermission() },
                        onMaybeLaterClick = onMaybeLaterClick
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionMainContent(
    onAllowAccessClick: () -> Unit,
    onMaybeLaterClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 480.dp)
                .fillMaxWidth()
        ) {
            // Central card
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.outlinedCardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Dual icon visualization
                    PermissionIconsVisual()

                    Spacer(modifier = Modifier.height(32.dp))

                    Text(
                        text = stringResource(id = com.izisoft.pp09base.R.string.permission_enable_camera_title),
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = stringResource(id = com.izisoft.pp09base.R.string.permission_enable_camera_description),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )

                    Spacer(modifier = Modifier.height(40.dp))

                    // CTA buttons
                    PermissionActionButtons(
                        onAllowAccessClick = onAllowAccessClick,
                        onMaybeLaterClick = onMaybeLaterClick
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Privacy note
            PermissionPrivacyNote()
        }
    }
}

@Composable
private fun PermissionBackgroundDecor() {
    Box(modifier = Modifier.fillMaxSize()) {
        // Top-right amber glow — requires API 31+ for hardware-accelerated blur
        Box(
            modifier = Modifier
                .size(400.dp)
                .align(Alignment.TopEnd)
                .offset(x = 60.dp, y = (-60).dp)
                .blur(120.dp)
                .background(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f),
                    shape = CircleShape
                )
        )
        // Bottom-left secondary glow
        Box(
            modifier = Modifier
                .size(300.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-30).dp, y = 30.dp)
                .blur(100.dp)
                .background(
                    color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f),
                    shape = CircleShape
                )
        )
    }
}
