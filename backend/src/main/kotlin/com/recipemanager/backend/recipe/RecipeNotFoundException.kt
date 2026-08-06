package com.recipemanager.backend.recipe

class RecipeNotFoundException(
    id: Long,
) : RuntimeException("id=$id のレシピが見つかりません")
