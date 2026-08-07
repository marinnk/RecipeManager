package com.recipemanager.backend.metadata.dto

import jakarta.validation.constraints.NotBlank

data class MetadataFetchRequest(
    @field:NotBlank(message = "urlは必須です")
    val url: String,
)
