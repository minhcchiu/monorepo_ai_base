package com.izisoft.pp09base.features.welcome.data.repository

import com.izisoft.pp09base.features.welcome.data.api.WelcomeApi
import com.izisoft.pp09base.features.welcome.data.model.Welcome
import com.izisoft.pp09base.features.welcome.data.model.toDomain
import javax.inject.Inject

class WelcomeRepositoryImpl @Inject constructor(
    private val api: WelcomeApi
) : WelcomeRepository {
    override suspend fun getWelcome(): Welcome {
        try {
            val dto = api.getWelcome()
            return dto.toDomain()
        } catch (e: Exception) {
            return Welcome(title = "Welcome", subtitle = "Welcome to the app", imageUrl = null)
        }
    }
}
