package com.recipemanager.backend.metadata

import org.jsoup.Jsoup
import org.springframework.stereotype.Component

/**
 * YouTube以外の一般的なレシピサイトを想定し、ページのOGPメタタグ
 * （og:title, og:image）からタイトル・サムネイルを取得する。
 */
@Component
class OgpFetcher {
    fun fetch(url: String): OgpResult {
        val document =
            try {
                Jsoup
                    .connect(url)
                    .timeout(TIMEOUT_MILLIS)
                    .userAgent(USER_AGENT)
                    .get()
            } catch (e: Exception) {
                throw MetadataFetchException(FAILURE_MESSAGE)
            }

        val title =
            document.select("meta[property=og:title]").attr("content").ifBlank {
                document.title()
            }
        if (title.isBlank()) {
            throw MetadataFetchException(FAILURE_MESSAGE)
        }
        val thumbnailUrl = document.select("meta[property=og:image]").attr("content").ifBlank { null }

        return OgpResult(title = title, thumbnailUrl = thumbnailUrl)
    }

    companion object {
        private const val TIMEOUT_MILLIS = 5000
        private const val USER_AGENT = "Mozilla/5.0 (compatible; RecipeManagerBot/1.0)"
        private const val FAILURE_MESSAGE = "情報を取得できませんでした。手動で入力してください"
    }
}

data class OgpResult(
    val title: String,
    val thumbnailUrl: String?,
)
