package com.recipemanager.backend.recipe

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.recipemanager.backend.tag.InvalidTagException
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(RecipeController::class)
class RecipeControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var recipeService: RecipeService

    @Test
    fun `titleが256文字以上の場合は400でVALIDATION_ERRORを返す`() {
        val body = mapOf("title" to "あ".repeat(256), "tags" to emptyList<String>())

        mockMvc
            .perform(
                post("/api/recipes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }

    @Test
    fun `urlがURL形式でない場合は400でVALIDATION_ERRORを返す`() {
        val body = mapOf("title" to "肉じゃが", "url" to "not-a-url", "tags" to emptyList<String>())

        mockMvc
            .perform(
                post("/api/recipes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }

    @Test
    fun `タグが21個以上の場合は400でVALIDATION_ERRORを返す`() {
        val body = mapOf("title" to "肉じゃが", "tags" to (1..21).map { "タグ$it" })

        mockMvc
            .perform(
                post("/api/recipes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }

    @Test
    fun `タグ名が長すぎてInvalidTagExceptionが発生すると400でVALIDATION_ERRORを返す`() {
        val body = mapOf("title" to "肉じゃが", "tags" to listOf("た".repeat(31)))
        every { recipeService.create(any()) } throws InvalidTagException("タグは30文字以内で入力してください")

        mockMvc
            .perform(
                post("/api/recipes")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }
}
