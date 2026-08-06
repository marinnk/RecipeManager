package com.recipemanager.backend.image

import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(ImageController::class)
class ImageControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var imageStorageService: ImageStorageService

    @Test
    fun `正常な画像をPOSTすると201でURLを返す`() {
        every { imageStorageService.store(any()) } returns "/api/uploads/xxxx.jpg"
        val file = MockMultipartFile("file", "photo.jpg", "image/jpeg", "dummy".toByteArray())

        mockMvc
            .perform(multipart("/api/images").file(file))
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.url").value("/api/uploads/xxxx.jpg"))
    }

    @Test
    fun `不正な画像でInvalidImageFileExceptionが発生すると400でVALIDATION_ERRORを返す`() {
        every { imageStorageService.store(any()) } throws
            InvalidImageFileException("jpeg・png・webp形式の画像のみアップロードできます")
        val file = MockMultipartFile("file", "note.txt", "text/plain", "x".toByteArray())

        mockMvc
            .perform(multipart("/api/images").file(file))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    }
}
