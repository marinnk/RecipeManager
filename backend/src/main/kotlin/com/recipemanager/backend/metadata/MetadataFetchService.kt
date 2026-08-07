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

        if (youtubeOembedClient.isYoutubeUrl(normalizedUrl)) {
            // 埋め込みが許可されていない動画などではoEmbedが失敗する（401等）ことがある。
            // その場合も動画ページ自体のOGPタグは公開されていることが多いため、
            // 諦めずにOGP取得にフォールバックする。
            val oembedResult = runCatching { youtubeOembedClient.fetch(normalizedUrl) }.getOrNull()
            if (oembedResult != null) {
                return MetadataFetchResponse(title = oembedResult.title, thumbnailUrl = oembedResult.thumbnailUrl)
            }
        }

        val result = ogpFetcher.fetch(normalizedUrl)
        return MetadataFetchResponse(title = result.title, thumbnailUrl = result.thumbnailUrl)
    }

    companion object {
        private const val FAILURE_MESSAGE = "情報を取得できませんでした。手動で入力してください"
    }
}
