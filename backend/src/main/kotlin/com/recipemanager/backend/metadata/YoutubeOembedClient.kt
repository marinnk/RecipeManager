package com.recipemanager.backend.metadata

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.util.UriComponentsBuilder
import java.time.Duration

/**
 * YouTubeの動画URLかどうかの判定と、YouTube oEmbed APIを使ったタイトル・
 * サムネイル取得を担当する。oEmbedはAPIキー不要で呼び出せる公開エンドポイント。
 */
@Component
class YoutubeOembedClient {
    private val restClient: RestClient =
        RestClient
            .builder()
            .requestFactory(
                SimpleClientHttpRequestFactory().apply {
                    setConnectTimeout(TIMEOUT)
                    setReadTimeout(TIMEOUT)
                },
            ).build()

    fun isYoutubeUrl(url: String): Boolean {
        val host =
            runCatching { java.net.URI(url).host }.getOrNull()?.lowercase() ?: return false
        return host == "youtu.be" || host.endsWith("youtube.com")
    }

    fun fetch(url: String): OembedResult {
        // urlパラメータ自体が"?"や"="を含むURLなので、encode()せずに文字列結合すると
        // クエリの区切りと衝突して壊れたURIになる。build().encode()で正しくパーセント
        // エンコードした上で、java.net.URIとして渡す（restClient.uri(String)だと
        // 文字列をURIテンプレートとして再解釈されてしまい、既にエンコード済みのはずの
        // "?"を含む値が想定通りに扱われないため、URIオブジェクトのまま渡す）。
        val oembedUri =
            UriComponentsBuilder
                .fromUriString("https://www.youtube.com/oembed")
                .queryParam("url", url)
                .queryParam("format", "json")
                .build()
                .encode()
                .toUri()

        val response =
            try {
                restClient
                    .get()
                    .uri(oembedUri)
                    .retrieve()
                    .body(OembedResponse::class.java)
            } catch (e: Exception) {
                throw MetadataFetchException(FAILURE_MESSAGE)
            }

        val title = response?.title
        if (title.isNullOrBlank()) {
            throw MetadataFetchException(FAILURE_MESSAGE)
        }
        return OembedResult(title = title, thumbnailUrl = response.thumbnailUrl)
    }

    companion object {
        private val TIMEOUT = Duration.ofSeconds(5)
        private const val FAILURE_MESSAGE = "情報を取得できませんでした。手動で入力してください"
    }
}

data class OembedResult(
    val title: String,
    val thumbnailUrl: String?,
)

// YouTube oEmbedのレスポンスはsnake_case（thumbnail_url）で返ってくるため、
// @JsonPropertyで明示的にマッピングする。
@JsonIgnoreProperties(ignoreUnknown = true)
private data class OembedResponse(
    val title: String?,
    @JsonProperty("thumbnail_url")
    val thumbnailUrl: String?,
)
