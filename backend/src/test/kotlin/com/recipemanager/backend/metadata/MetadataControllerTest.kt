package com.recipemanager.backend.metadata

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.recipemanager.backend.metadata.dto.MetadataFetchResponse
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(MetadataController::class)
class MetadataControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var metadataFetchService: MetadataFetchService

    @Test
    fun `URLを渡すと200でタイトル・サムネイルを返す`() {
        val url = "https://www.youtube.com/watch?v=xxxx"
        every { metadataFetchService.fetch(url) } returns
            MetadataFetchResponse(title = "肉じゃがの作り方", thumbnailUrl = "https://i.ytimg.com/vi/xxxx/hqdefault.jpg")

        mockMvc
            .perform(
                post("/api/metadata/fetch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mapOf("url" to url))),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.title").value("肉じゃがの作り方"))
            .andExpect(jsonPath("$.thumbnailUrl").value("https://i.ytimg.com/vi/xxxx/hqdefault.jpg"))
    }

    @Test
    fun `urlが空の場合は400でVALIDATION_ERRORを返す`() {
        mockMvc
            .perform(
                post("/api/metadata/fetch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mapOf("url" to ""))),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }

    @Test
    fun `urlがURL形式でない場合は400でVALIDATION_ERRORを返す`() {
        mockMvc
            .perform(
                post("/api/metadata/fetch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mapOf("url" to "not-a-url"))),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }

    @Test
    fun `取得に失敗した場合は422でMETADATA_FETCH_FAILEDを返す`() {
        val url = "https://example.com/unknown"
        every { metadataFetchService.fetch(url) } throws
            MetadataFetchException("情報を取得できませんでした。手動で入力してください")

        mockMvc
            .perform(
                post("/api/metadata/fetch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mapOf("url" to url))),
            ).andExpect(status().isUnprocessableEntity)
            .andExpect(jsonPath("$.error").value("METADATA_FETCH_FAILED"))
    }
}
