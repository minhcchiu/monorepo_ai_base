package com.izisoft.pp09base.features.profile.ui.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.izisoft.pp09base.R

data class ProfileLanguageOption(
    val code: String,
    val localeTag: String
)

val ProfileLanguageOptions = listOf(
    ProfileLanguageOption(code = "EN", localeTag = "en"),
    ProfileLanguageOption(code = "ES", localeTag = "es"),
    ProfileLanguageOption(code = "PT", localeTag = "pt-BR"),
    ProfileLanguageOption(code = "JA", localeTag = "ja"),
    ProfileLanguageOption(code = "KO", localeTag = "ko")
)

fun profileLanguageLabelResId(code: String): Int {
    return when (code) {
        "EN" -> R.string.profile_lang_english
        "ES" -> R.string.profile_lang_spanish
        "PT" -> R.string.profile_lang_portuguese_brazil
        "JA" -> R.string.profile_lang_japanese
        "KO" -> R.string.profile_lang_korean
        else -> R.string.profile_lang_english
    }
}

@Composable
fun profileLanguageLabelForUi(code: String): String {
    return stringResource(id = profileLanguageLabelResId(code))
}

fun profileLanguageLocaleTag(code: String): String {
    return ProfileLanguageOptions.firstOrNull { it.code == code }?.localeTag ?: "en"
}
