package com.recipemanager.backend.common.error

import com.ninjasquad.springmockk.MockkBean
import com.recipemanager.backend.tag.TagController
import com.recipemanager.backend.tag.TagService
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

// GlobalExceptionHandlerの汎用フォールバックハンドラを、既存のTagControllerスライスを
// 借りて検証する。専用のダミーコントローラを作らず、既にある単純なエンドポイント
// （引数無しGET）で想定外の例外を発生させることで検証コストを抑えている。
@WebMvcTest(TagController::class)
class GlobalExceptionHandlerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockkBean
    private lateinit var tagService: TagService

    @Test
    fun `想定外の例外が発生すると500でINTERNAL_SERVER_ERRORを返す`() {
        every { tagService.findAll() } throws IllegalStateException("DB接続エラー")

        mockMvc
            .perform(get("/api/tags"))
            .andExpect(status().isInternalServerError)
            .andExpect(jsonPath("$.error").value("INTERNAL_SERVER_ERROR"))
            .andExpect(jsonPath("$.message").value("予期しないエラーが発生しました。時間をおいて再度お試しください。"))
    }
}
