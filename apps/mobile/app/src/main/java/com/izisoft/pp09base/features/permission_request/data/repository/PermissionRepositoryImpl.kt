package com.izisoft.pp09base.features.permission_request.data.repository

import com.izisoft.pp09base.features.permission_request.data.api.PermissionApi
import com.izisoft.pp09base.features.permission_request.data.model.Permission
import com.izisoft.pp09base.features.permission_request.data.model.toDomain
import javax.inject.Inject

class PermissionRepositoryImpl @Inject constructor(
    private val api: PermissionApi
) : PermissionRepository {
    override suspend fun getPermissionRationale(): Permission {
        try {
            val dto = api.getPermissionInfo()
            return dto.toDomain()
        } catch (e: Exception) {
            // fall back to a sensible default rationale
            return Permission(title = "Permission Required", message = "This app requires permissions to continue.")
        }
    }
}
