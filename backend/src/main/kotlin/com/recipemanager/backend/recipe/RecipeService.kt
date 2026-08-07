package com.recipemanager.backend.recipe

import com.recipemanager.backend.image.ImageStorageService
import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeResponse
import com.recipemanager.backend.recipe.dto.RecipeUpdateRequest
import com.recipemanager.backend.tag.Tag
import com.recipemanager.backend.tag.TagRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val tagRepository: TagRepository,
    private val imageStorageService: ImageStorageService,
) {
    @Transactional(readOnly = true)
    fun findAll(): List<RecipeResponse> = recipeRepository.findAllByOrderByCreatedAtDesc().map { RecipeResponse.from(it) }

    @Transactional(readOnly = true)
    fun findById(id: Long): RecipeResponse {
        val recipe = recipeRepository.findById(id).orElseThrow { RecipeNotFoundException(id) }
        return RecipeResponse.from(recipe)
    }

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

    @Transactional
    fun update(
        id: Long,
        request: RecipeUpdateRequest,
    ): RecipeResponse {
        val recipe = recipeRepository.findById(id).orElseThrow { RecipeNotFoundException(id) }
        recipe.title = request.title
        recipe.url = request.url
        recipe.thumbnailUrl = request.thumbnailUrl
        recipe.memo = request.memo
        recipe.tags = resolveTags(request.tags)

        val saved = recipeRepository.save(recipe)
        return RecipeResponse.from(saved)
    }

    @Transactional
    fun delete(id: Long) {
        val recipe = recipeRepository.findById(id).orElseThrow { RecipeNotFoundException(id) }
        // レコードだけでなく、アップロード済みのサムネイル画像ファイルもここで一緒に消しておかないと、
        // uploadsディレクトリにどのレシピからも参照されない画像が溜まっていく。
        recipe.thumbnailUrl?.let { imageStorageService.delete(it) }
        recipeRepository.delete(recipe)
    }

    private fun resolveTags(tagNames: List<String>): MutableSet<Tag> =
        tagNames
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .distinct()
            .map { name -> tagRepository.findByName(name) ?: tagRepository.save(Tag(name = name)) }
            .toMutableSet()
}
