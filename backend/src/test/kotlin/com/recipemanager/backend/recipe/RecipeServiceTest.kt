package com.recipemanager.backend.recipe

import com.recipemanager.backend.image.ImageStorageService
import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeUpdateRequest
import com.recipemanager.backend.tag.InvalidTagException
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
    fun `キーワードを指定するとタイトルで絞り込むクエリが呼ばれる`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        every { recipeRepository.search("肉じゃが", emptyList(), 0L) } returns listOf(recipe)

        val response = recipeService.findAll(keyword = "肉じゃが")

        assertEquals(listOf("肉じゃが"), response.map { it.title })
        verify(exactly = 0) { recipeRepository.findAllByOrderByCreatedAtDesc() }
    }

    @Test
    fun `キーワードの前後の空白は取り除かれる`() {
        every { recipeRepository.search("肉じゃが", emptyList(), 0L) } returns emptyList()

        recipeService.findAll(keyword = "  肉じゃが  ")

        verify(exactly = 1) { recipeRepository.search("肉じゃが", emptyList(), 0L) }
    }

    @Test
    fun `キーワードが空白のみのときは絞り込み無しとして扱われる`() {
        every { recipeRepository.findAllByOrderByCreatedAtDesc() } returns emptyList()

        recipeService.findAll(keyword = "   ")

        verify(exactly = 1) { recipeRepository.findAllByOrderByCreatedAtDesc() }
        verify(exactly = 0) { recipeRepository.search(any(), any(), any()) }
    }

    @Test
    fun `タグを指定すると重複を除いたタグ名とタグ数で絞り込むクエリが呼ばれる`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        every { recipeRepository.search(null, listOf("和食", "時短"), 2L) } returns listOf(recipe)

        val response = recipeService.findAll(tags = listOf("和食", "時短", "和食"))

        assertEquals(listOf("肉じゃが"), response.map { it.title })
        verify(exactly = 1) { recipeRepository.search(null, listOf("和食", "時短"), 2L) }
    }

    @Test
    fun `キーワードとタグを両方指定すると両方の条件でクエリが呼ばれる`() {
        every { recipeRepository.search("肉じゃが", listOf("和食"), 1L) } returns emptyList()

        recipeService.findAll(keyword = "肉じゃが", tags = listOf("和食"))

        verify(exactly = 1) { recipeRepository.search("肉じゃが", listOf("和食"), 1L) }
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
    fun `URLが未指定でもレシピが登録できる`() {
        val request = RecipeCreateRequest(title = "肉じゃが", url = null)

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
        assertEquals(null, response.url)
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
    fun `タグ名が31文字以上の場合はInvalidTagExceptionが発生する`() {
        val request =
            RecipeCreateRequest(
                title = "肉じゃが",
                tags = listOf("た".repeat(31)),
            )

        assertThrows<InvalidTagException> { recipeService.create(request) }

        verify(exactly = 0) { recipeRepository.save(any()) }
    }

    @Test
    fun `タグ名がちょうど30文字の場合は登録できる`() {
        val tagName = "た".repeat(30)
        val request = RecipeCreateRequest(title = "肉じゃが", tags = listOf(tagName))
        every { tagRepository.findByName(tagName) } returns null
        every { tagRepository.save(match { it.name == tagName }) } returns Tag(name = tagName).apply { id = 1L }
        val savedSlot = slot<Recipe>()
        every { recipeRepository.save(capture(savedSlot)) } answers {
            savedSlot.captured.apply {
                id = 10L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        }

        val response = recipeService.create(request)

        assertEquals(listOf(tagName), response.tags)
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
    fun `URLが未指定でもレシピが更新できる`() {
        val recipe =
            Recipe(title = "肉じゃが", url = "https://www.youtube.com/watch?v=xxxx").apply {
                id = 1L
                createdAt = Instant.now()
                updatedAt = Instant.now()
            }
        val request = RecipeUpdateRequest(title = "肉じゃが", url = null)
        every { recipeRepository.findById(1L) } returns Optional.of(recipe)
        every { recipeRepository.save(any()) } answers { firstArg() }

        val response = recipeService.update(1L, request)

        assertEquals(null, response.url)
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
