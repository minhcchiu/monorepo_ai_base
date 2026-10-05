package com.izisoft.pp09base

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

/**
 * Placeholder màn hình đích sau khi đăng nhập/onboarding xong. Base không có feature
 * nghiệp vụ nào — mỗi sản phẩm clone base thay hẳn composable này bằng shell thật
 * (bottom nav + màn hình chính) mà vẫn giữ nguyên route MAIN trong AppNavigation.
 */
@Composable
fun MainScreen(onOpenProfile: () -> Unit) {
    Scaffold { paddingValues ->
        Box(
            modifier = androidx.compose.ui.Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "MainScreen placeholder — thay bằng màn hình chính của sản phẩm",
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}
