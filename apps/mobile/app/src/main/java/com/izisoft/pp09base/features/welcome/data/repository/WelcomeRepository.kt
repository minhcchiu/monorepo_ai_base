package com.izisoft.pp09base.features.welcome.data.repository

import com.izisoft.pp09base.features.welcome.data.model.Welcome

interface WelcomeRepository {
    suspend fun getWelcome(): Welcome
}
