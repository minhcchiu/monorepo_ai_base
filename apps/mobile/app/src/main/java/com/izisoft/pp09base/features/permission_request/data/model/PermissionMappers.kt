package com.izisoft.pp09base.features.permission_request.data.model

fun PermissionDto.toDomain(): Permission = Permission(
    title = rationaleTitle,
    message = rationaleMessage
)
