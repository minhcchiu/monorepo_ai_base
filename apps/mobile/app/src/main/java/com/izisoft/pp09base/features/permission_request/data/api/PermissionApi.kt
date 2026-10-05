package com.izisoft.pp09base.features.permission_request.data.api

import com.izisoft.pp09base.features.permission_request.data.model.PermissionDto
import retrofit2.http.GET

interface PermissionApi {
    @GET("/permissions/info") // TODO: replace with real endpoint if needed
    suspend fun getPermissionInfo(): PermissionDto
}
