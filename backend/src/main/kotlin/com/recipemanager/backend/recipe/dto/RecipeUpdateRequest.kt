package com.recipemanager.backend.recipe.dto

import jakarta.validation.constraints.NotBlank

data class RecipeUpdateRequest(
    @field:NotBlank(message = "titleは必須です")
    val title: String,
    @field:NotBlank(message = "urlは必須です")
    val url: String,
    val thumbnailUrl: String? = null,
    val memo: String? = null,
    val tags: List<String> = emptyList(),
)
