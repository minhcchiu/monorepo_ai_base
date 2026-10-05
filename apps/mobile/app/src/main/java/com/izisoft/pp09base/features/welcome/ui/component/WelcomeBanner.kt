package com.izisoft.pp09base.features.welcome.ui.component

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.rememberAsyncImagePainter
import com.izisoft.pp09base.features.welcome.data.model.Welcome

@Composable
fun WelcomeBanner(w: Welcome) {
    Card(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
        Column(modifier = Modifier.padding(12.dp)) {
            w.imageUrl?.let { img ->
                Image(painter = rememberAsyncImagePainter(img), contentDescription = w.title, modifier = Modifier.fillMaxWidth(), contentScale = ContentScale.Crop)
            }
            Text(text = w.title, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(top = 8.dp))
            Text(text = w.subtitle, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 4.dp))
        }
    }
}
