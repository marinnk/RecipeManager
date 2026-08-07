package com.recipemanager.backend.recipe

import com.recipemanager.backend.image.ImageStorageService
import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeUpdateRequest
import com.recipemanager.backend.tag.Tag
import com.recipemanager.backend.tag.TagRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Instant
import java.util.Optional

class RecipeServiceTest {
    private val recipeRepository = mockk<RecipeRepository>()
    private val tagRepository = mockk<TagRepository>()
    private val imageStorageService = mockk<ImageStorageService>(relaxed = true)
    private val recipeService = RecipeService(recipeRepository, tagRepository, imageStorageService)

    @Test
    fun `登録済みレシピを作成日時の新しい順で返す`() {
        val older =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
                createdAt = Instant.parse("2026-08-01T10:00:00Z")
                updatedAt = Instant.parse("2026-08-01T10:00:00Z")
            }
        val newer =
            Recipe(title = "唐揚げ", url = "https://www.youtube.com/watch?v=yyyy").apply {
                id = 2L
                createdAt = Instant.parse("2026-08-02T10:00:00Z")
                updatedAt = Instant.parse("2026-08-02T10:00:00Z")
            }
        every { recipeRepository.findAllByOrderByCreatedAtDesc() } returns listOf(newer, older)

        val response = recipeService.findAll()

        assertEquals(listOf("唐揚げ", "肉じゃが"), response.map { it.title })
    }

    @Test
    fun `レシピが0件のとき空リストを返す`() {
        every { recipeRepository.findAllByOrderByCreatedAtDesc() } returns emptyList()

        val response = recipeService.findAll()

        assertEquals(emptyList<Any>(), response)
    }

    @Test
    fun `登録するとタイトル・URL・タグを持つレシピが保存される`() {
        val request =
            RecipeCreateRequest(
                title = "肉じゃが",
                url = "https://www.youtube.com/watch?v=xxxx",
                memo = "醤油を控えめにすると美味しい",
                tags = listOf("和食", "煮物"),
            )
        every { tagRepository.findByName("和食") } returns Tag(name = "和食").apply { id = 1L }
        every { tagRepository.findByName("煮物") } returns null
        every { tagRepository.save(match { it.name == "煮物" }) } returns Tag(name = "煮物").apply { id = 2L }

        val savedSlot = slot<Recipe>()
        every { recipeRepository.save(capture(savedSlot)) } answers {
            savedSlot.captured.apply {
                id = 10L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        }

        val response = recipeService.create(request)

        assertEquals("肉じゃが", response.title)
        assertEquals(setOf("和食", "煮物"), response.tags.toSet())
        verify(exactly = 1) { recipeRepository.save(any()) }
    }

    @Test
    fun `既存タグは再利用され新規タグとして重複作成されない`() {
        val request =
            RecipeCreateRequest(
                title = "唐揚げ",
                url = "https://www.youtube.com/watch?v=yyyy",
                tags = listOf("和食"),
            )
        every { tagRepository.findByName("和食") } returns Tag(name = "和食").apply { id = 1L }

        val savedSlot = slot<Recipe>()
        every { recipeRepository.save(capture(savedSlot)) } answers {
            savedSlot.captured.apply {
                id = 11L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        }

        recipeService.create(request)

        verify(exactly = 0) { tagRepository.save(any()) }
    }

    @Test
    fun `存在するIDでレシピを取得できる`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
                createdAt = Instant.parse("2026-08-01T10:00:00Z")
                updatedAt = Instant.parse("2026-08-01T10:00:00Z")
            }
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)

        val response = recipeService.findById(1L)

        assertEquals("肉じゃが", response.title)
    }

    @Test
    fun `存在しないIDで取得するとRecipeNotFoundExceptionが発生する`() {
        every { recipeRepository.findById(99L) } returns Optional.empty()

        assertThrows<RecipeNotFoundException> { recipeService.findById(99L) }
    }

    @Test
    fun `更新するとタイトル・URL・メモ・タグが更新される`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx", memo = "旧メモ").apply {
                id = 1L
                createdAt = Instant.parse("2026-08-01T10:00:00Z")
                updatedAt = Instant.parse("2026-08-01T10:00:00Z")
            }
        val request =
            RecipeUpdateRequest(
                title = "肉じゃが（改）",
                url = "https://www.youtube.com/watch?v=zzzz",
                memo = "新メモ",
                tags = listOf("和食"),
            )
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { tagRepository.findByName("和食") } returns Tag(name = "和食").apply { id = 1L }
        val savedSlot = slot<Recipe>()
        every { recipeRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

        val response = recipeService.update(1L, request)

        assertEquals("肉じゃが（改）", response.title)
        assertEquals("https://www.youtube.com/watch?v=zzzz", response.url)
        assertEquals("新メモ", response.memo)
        assertEquals(listOf("和食"), response.tags)
        verify(exactly = 1) { recipeRepository.save(any()) }
    }

    @Test
    fun `更新時に既存タグは再利用され新規タグとして重複作成されない`() {
        val recipe =
            Recipe(title = "唐揚げ", url = "https://www.youtube.com/watch?v=yyyy").apply {
                id = 1L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        val request =
            RecipeUpdateRequest(
                title = "唐揚げ",
                url = "https://www.youtube.com/watch?v=yyyy",
                tags = listOf("和食"),
            )
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { tagRepository.findByName("和食") } returns Tag(name = "和食").apply { id = 1L }
        every { recipeRepository.save(any()) } answers { firstArg() }

        recipeService.update(1L, request)

        verify(exactly = 0) { tagRepository.save(any()) }
    }

    @Test
    fun `更新時にタグを空にすると全てのタグが解除される`() {
        val recipe =
            Recipe(title = "唐揚げ", url = "https://www.youtube.com/watch?v=yyyy").apply {
                id = 1L
                createdAt = Instant.now()
                updatedAt = Instant.now()
                tags = mutableSetOf(Tag(name = "和食").apply { id = 1L })
            }
        val request =
            RecipeUpdateRequest(
                title = "唐揚げ",
                url = "https://www.youtube.com/watch?v=yyyy",
                tags = emptyList(),
            )
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { recipeRepository.save(any()) } answers { firstArg() }

        val response = recipeService.update(1L, request)

        assertEquals(emptyList<String>(), response.tags)
    }

    @Test
    fun `存在しないIDで更新するとRecipeNotFoundExceptionが発生する`() {
        val request =
            RecipeUpdateRequest(
                title = "唐揚げ",
                url = "https://www.youtube.com/watch?v=yyyy",
            )
        every { recipeRepository.findById(99L) } returns Optional.empty()

        assertThrows<RecipeNotFoundException> { recipeService.update(99L, request) }

        verify(exactly = 0) { recipeRepository.save(any()) }
    }

    @Test
    fun `存在するIDで削除するとレシピが削除される`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
            }
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { recipeRepository.delete(recipe) } returns Unit

        recipeService.delete(1L)

        verify(exactly = 1) { recipeRepository.delete(recipe) }
    }

    @Test
    fun `サムネイル画像があるレシピを削除すると画像ファイルも削除される`() {
        val recipe =
            Recipe(
                title = "肉じゃが",
                url = "https://www.youtube.com/watch?v=xxxx",
                thumbnailUrl = "/api/uploads/xxxx.jpg",
            ).apply { id = 1L }
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { recipeRepository.delete(recipe) } returns Unit

        recipeService.delete(1L)

        verify(exactly = 1) { imageStorageService.delete("/api/uploads/xxxx.jpg") }
    }

    @Test
    fun `サムネイル画像が無いレシピを削除しても画像削除は呼ばれない`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
            }
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { recipeRepository.delete(recipe) } returns Unit

        recipeService.delete(1L)

        verify(exactly = 0) { imageStorageService.delete(any()) }
    }

    @Test
    fun `存在しないIDで削除するとRecipeNotFoundExceptionが発生する`() {
        every { recipeRepository.findById(99L) } returns Optional.empty()

        assertThrows<RecipeNotFoundException> { recipeService.delete(99L) }

        verify(exactly = 0) { recipeRepository.delete(any()) }
    }
}
