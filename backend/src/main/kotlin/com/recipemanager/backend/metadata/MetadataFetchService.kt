package com.recipemanager.backend.metadata

import com.recipemanager.backend.metadata.dto.MetadataFetchResponse
import org.springframework.stereotype.Service

@Service
class MetadataFetchService(
    private val youtubeOembedClient: YoutubeOembedClient,
    private val ogpFetcher: OgpFetcher,
) {
    fun fetch(url: String): MetadataFetchResponse {
        // 前後に空白が入っているとjava.net.URIのパースに失敗し、スキーム判定が
        // 全て失敗扱いになってしまう（コピペ時などに混入しやすい）。ここで一度だけ
        // trimして、以降はこのnormalizedUrlを使い回す。
        val normalizedUrl = url.trim()

        // file:// 等、http/https以外のスキームへの到達を防ぐ最低限のガード。
        val scheme = runCatching { java.net.URI(normalizedUrl).scheme }.getOrNull()?.lowercase()
        if (scheme != "http" && scheme != "https") {
            throw MetadataFetchException(FAILURE_MESSAGE)
        }

        return if (youtubeOembedClient.isYoutubeUrl(normalizedUrl)) {
            val result = youtubeOembedClient.fetch(normalizedUrl)
            MetadataFetchResponse(title = result.title, thumbnailUrl = result.thumbnailUrl)
        } else {
            val result = ogpFetcher.fetch(normalizedUrl)
            MetadataFetchResponse(title = result.title, thumbnailUrl = result.thumbnailUrl)
        }
    }

    companion object {
        private const val FAILURE_MESSAGE = "情報を取得できませんでした。手動で入力してください"
    }
}
