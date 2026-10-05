package com.izisoft.pp09base.features.welcome.ui.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.res.stringResource
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.rememberAsyncImagePainter
import com.izisoft.pp09base.features.welcome.logic.WelcomeViewModel

@Composable
fun WelcomeScreen(viewModel: WelcomeViewModel, onContinue: () -> Unit) {
    val state = viewModel.state.collectAsState()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.value.isLoading -> Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator() }

            state.value.error != null -> Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = state.value.error ?: stringResource(id = com.izisoft.pp09base.R.string.generic_error), color = MaterialTheme.colorScheme.error)
                Button(onClick = { viewModel.loadWelcome() }, modifier = Modifier.padding(top = 8.dp)) { Text(stringResource(id = com.izisoft.pp09base.R.string.retry)) }
            }

            else -> {
                val w = state.value.welcome
                Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    w?.imageUrl?.let { img ->
                        Image(painter = rememberAsyncImagePainter(img), contentDescription = w.title, modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), contentScale = ContentScale.Crop)
                    }
                    Text(text = w?.title ?: stringResource(id = com.izisoft.pp09base.R.string.welcome_title), style = MaterialTheme.typography.headlineMedium)
                    Text(text = w?.subtitle ?: "", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
                    Button(onClick = onContinue, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) { Text(stringResource(id = com.izisoft.pp09base.R.string.continue_label)) }
                }
            }
        }
    }
}
