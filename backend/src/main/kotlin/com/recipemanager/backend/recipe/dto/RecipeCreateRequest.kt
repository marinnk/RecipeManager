package com.recipemanager.backend.recipe.dto

import jakarta.validation.constraints.NotBlank

data class RecipeCreateRequest(
    @field:NotBlank(message = "titleは必須です")
    val title: String,
    val url: String? = null,
    val thumbnailUrl: String? = null,
    val memo: String? = null,
    val tags: List<String> = emptyList(),
)
