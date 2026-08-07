package com.recipemanager.backend.tag

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TagServiceTest {
    private val tagRepository = mockk<TagRepository>()
    private val tagService = TagService(tagRepository)

    @Test
    fun `登録済みタグを名前順で返す`() {
        every { tagRepository.findAllByOrderByNameAsc() } returns
            listOf(Tag(name = "和食").apply { id = 1L }, Tag(name = "時短").apply { id = 2L })

        val result = tagService.findAll()

        assertEquals(listOf("和食", "時短"), result)
    }

    @Test
    fun `タグが1件も無いときは空リストを返す`() {
        every { tagRepository.findAllByOrderByNameAsc() } returns emptyList()

        val result = tagService.findAll()

        assertEquals(emptyList<String>(), result)
    }
}
