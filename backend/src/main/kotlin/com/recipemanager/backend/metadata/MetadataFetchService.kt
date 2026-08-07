package com.recipemanager.backend.metadata

import com.recipemanager.backend.metadata.dto.MetadataFetchResponse
import org.springframework.stereotype.Service

@Service
class MetadataFetchService(
    private val youtubeOembedClient: YoutubeOembedClient,
    private val ogpFetcher: OgpFetcher,
) {
    fun fetch(url: String): MetadataFetchResponse {
        // file:// 等、http/https以外のスキームへの到達を防ぐ最低限のガード。
        val scheme = runCatching { java.net.URI(url).scheme }.getOrNull()?.lowercase()
        if (scheme != "http" && scheme != "https") {
            throw MetadataFetchException(FAILURE_MESSAGE)
        }

        return if (youtubeOembedClient.isYoutubeUrl(url)) {
            val result = youtubeOembedClient.fetch(url)
            MetadataFetchResponse(title = result.title, thumbnailUrl = result.thumbnailUrl)
        } else {
            val result = ogpFetcher.fetch(url)
            MetadataFetchResponse(title = result.title, thumbnailUrl = result.thumbnailUrl)
        }
    }

    companion object {
        private const val FAILURE_MESSAGE = "情報を取得できませんでした。手動で入力してください"
    }
}
