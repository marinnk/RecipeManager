package com.recipemanager.backend.tag

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(TagController::class)
class TagControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var tagService: TagService

    @Test
    fun `タグ一覧を取得すると200でタグ名の配列を返す`() {
        every { tagService.findAll() } returns listOf("和食", "時短")

        mockMvc
            .perform(get("/api/tags"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0]").value("和食"))
            .andExpect(jsonPath("$[1]").value("時短"))
    }

    @Test
    fun `タグが1件も無いときは空配列を返す`() {
        every { tagService.findAll() } returns emptyList()

        mockMvc
            .perform(get("/api/tags"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isEmpty)
    }
}
