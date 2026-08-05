package com.recipemanager.backend.recipe

import org.springframework.data.jpa.repository.JpaRepository

interface RecipeRepository : JpaRepository<Recipe, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<Recipe>
}
