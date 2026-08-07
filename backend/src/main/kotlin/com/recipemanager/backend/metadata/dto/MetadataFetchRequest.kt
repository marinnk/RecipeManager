package com.recipemanager.backend.metadata.dto

import jakarta.validation.constraints.NotBlank
import org.hibernate.validator.constraints.URL

data class MetadataFetchRequest(
    @field:NotBlank(message = "urlは必須です")
    @field:URL(message = "urlの形式が正しくありません")
    val url: String,
)
