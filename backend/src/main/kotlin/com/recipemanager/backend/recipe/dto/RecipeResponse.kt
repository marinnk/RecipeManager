package com.recipemanager.backend.recipe.dto

import com.recipemanager.backend.recipe.Recipe
import java.time.Instant

data class RecipeResponse(
    val id: Long,
    val title: String,
    val url: String,
    val thumbnailUrl: String?,
    val memo: String?,
    val tags: List<String>,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(recipe: Recipe): RecipeResponse =
            RecipeResponse(
                id = requireNotNull(recipe.id),
                title = recipe.title,
                url = recipe.url,
                thumbnailUrl = recipe.thumbnailUrl,
                memo = recipe.memo,
                tags = recipe.tags.map { it.name },
                createdAt = requireNotNull(recipe.createdAt),
                updatedAt = requireNotNull(recipe.updatedAt),
            )
    }
}
