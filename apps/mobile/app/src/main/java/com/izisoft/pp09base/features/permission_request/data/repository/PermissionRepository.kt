package com.izisoft.pp09base.features.permission_request.data.repository

import com.izisoft.pp09base.features.permission_request.data.model.Permission

interface PermissionRepository {
    suspend fun getPermissionRationale(): Permission
}
