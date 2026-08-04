package com.recipemanager.backend.recipe

import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.tag.Tag
import com.recipemanager.backend.tag.TagRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant

class RecipeServiceTest {
    private val recipeRepository = mockk<RecipeRepository>()
    private val tagRepository = mockk<TagRepository>()
    private val recipeService = RecipeService(recipeRepository, tagRepository)

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
}
