package com.izisoft.pp09base.core.rating

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.izisoft.pp09base.core.R

@Composable
fun SatisfactionDialog(
    onSelectStar: (Int) -> Unit,
    onNotNow: () -> Unit,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        modifier = modifier,
        onDismissRequest = onNotNow,
        title = {
            Text(
                text = stringResource(id = R.string.rating_dialog_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = stringResource(id = R.string.rating_dialog_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (star in 1..5) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = stringResource(
                                id = R.string.rating_dialog_star_content_description,
                                star
                            ),
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .selectable(
                                    selected = false,
                                    onClick = { onSelectStar(star) }
                                )
                                .padding(4.dp)
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onNotNow) {
                Text(text = stringResource(id = R.string.rating_dialog_not_now))
            }
        }
    )
}

@Composable
fun FeedbackDialog(
    selectedReason: String,
    feedbackText: String,
    onReasonSelected: (String) -> Unit,
    onFeedbackTextChanged: (String) -> Unit,
    onSubmit: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    val reasons = listOf(
        stringResource(id = R.string.rating_feedback_reason_inaccurate_result),
        stringResource(id = R.string.rating_feedback_reason_too_many_ads),
        stringResource(id = R.string.rating_feedback_reason_app_slow),
        stringResource(id = R.string.rating_feedback_reason_other)
    )

    AlertDialog(
        modifier = modifier,
        onDismissRequest = onCancel,
        title = {
            Text(
                text = stringResource(id = R.string.rating_feedback_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = stringResource(id = R.string.rating_feedback_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                reasons.forEach { reason ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = selectedReason == reason,
                                onClick = { onReasonSelected(reason) }
                            )
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedReason == reason,
                            onClick = { onReasonSelected(reason) }
                        )
                        Text(
                            text = reason,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                OutlinedTextField(
                    value = feedbackText,
                    onValueChange = onFeedbackTextChanged,
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5,
                    label = { Text(stringResource(id = R.string.rating_feedback_optional_hint)) }
                )
            }
        },
        confirmButton = {
            Button(onClick = onSubmit) {
                Text(text = stringResource(id = R.string.rating_feedback_submit))
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onCancel) {
                Text(text = stringResource(id = R.string.rating_feedback_cancel))
            }
        }
    )
}
