package com.recipemanager.backend.recipe

import com.recipemanager.backend.image.ImageStorageService
import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeResponse
import com.recipemanager.backend.recipe.dto.RecipeUpdateRequest
import com.recipemanager.backend.tag.InvalidTagException
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
    fun findAll(
        keyword: String? = null,
        tags: List<String> = emptyList(),
    ): List<RecipeResponse> {
        val normalizedKeyword = keyword?.trim()?.takeIf { it.isNotEmpty() }
        val normalizedTags = tags.map { it.trim() }.filter { it.isNotEmpty() }.distinct()

        // 検索条件が何も指定されていない場合は、既存の全件取得クエリをそのまま使う。
        // JOIN/GROUP BYを伴う search() を常に使わないのは、絞り込み無しの一番よく使う経路を
        // シンプルなクエリのまま保つため。
        if (normalizedKeyword == null && normalizedTags.isEmpty()) {
            return recipeRepository.findAllByOrderByCreatedAtDesc().map { RecipeResponse.from(it) }
        }

        return recipeRepository
            .search(normalizedKeyword, normalizedTags, normalizedTags.size.toLong())
            .map { RecipeResponse.from(it) }
    }

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
            .onEach {
                if (it.length > TAG_NAME_MAX_LENGTH) {
                    throw InvalidTagException("タグは${TAG_NAME_MAX_LENGTH}文字以内で入力してください")
                }
            }.map { name -> tagRepository.findByName(name) ?: tagRepository.save(Tag(name = name)) }
            .toMutableSet()

    companion object {
        // タグの個数上限はDTO側の@Size(max = 20)で担保しているため、ここでは
        // トリム後でないと判定できないタグ名1件あたりの文字数上限のみ扱う。
        private const val TAG_NAME_MAX_LENGTH = 30
    }
}
