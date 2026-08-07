package com.recipemanager.backend.recipe.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.hibernate.validator.constraints.URL

data class RecipeCreateRequest(
    @field:NotBlank(message = "titleは必須です")
    @field:Size(max = 255, message = "titleは255文字以内で入力してください")
    val title: String,
    @field:Size(max = 2048, message = "urlは2048文字以内で入力してください")
    @field:URL(message = "urlの形式が正しくありません")
    val url: String? = null,
    @field:Size(max = 2048, message = "thumbnailUrlは2048文字以内で入力してください")
    @field:URL(message = "thumbnailUrlの形式が正しくありません")
    val thumbnailUrl: String? = null,
    @field:Size(max = 2000, message = "memoは2000文字以内で入力してください")
    val memo: String? = null,
    @field:Size(max = 20, message = "タグは20個以内にしてください")
    val tags: List<String> = emptyList(),
)
