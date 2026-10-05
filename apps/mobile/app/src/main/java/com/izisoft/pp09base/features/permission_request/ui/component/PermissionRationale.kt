package com.izisoft.pp09base.features.permission_request.ui.component

import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import com.izisoft.pp09base.features.permission_request.data.model.Permission

@Composable
fun PermissionRationale(permission: Permission, modifier: Modifier = Modifier) {
    Card(modifier = modifier.padding(8.dp)) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = permission.title, style = MaterialTheme.typography.titleMedium)
            Text(text = permission.message, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 6.dp))
        }
    }
}
