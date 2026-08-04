package com.recipemanager.backend.recipe

import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeResponse
import com.recipemanager.backend.tag.Tag
import com.recipemanager.backend.tag.TagRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val tagRepository: TagRepository,
) {
    @Transactional
    fun create(request: RecipeCreateRequest): RecipeResponse {
        val recipe =
            Recipe(
                title = request.title,
                url = request.url,
                thumbnailUrl = request.thumbnailUrl,
                memo = request.memo,
            )
        recipe.tags = resolveTags(request.tags)

        val saved = recipeRepository.save(recipe)
        return RecipeResponse.from(saved)
    }

    private fun resolveTags(tagNames: List<String>): MutableSet<Tag> =
        tagNames
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .distinct()
            .map { name -> tagRepository.findByName(name) ?: tagRepository.save(Tag(name = name)) }
            .toMutableSet()
}
