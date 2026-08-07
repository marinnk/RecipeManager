package com.recipemanager.backend.metadata

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class MetadataFetchServiceTest {
    private val youtubeOembedClient = mockk<YoutubeOembedClient>()
    private val ogpFetcher = mockk<OgpFetcher>()
    private val service = MetadataFetchService(youtubeOembedClient, ogpFetcher)

    @Test
    fun `YouTubeのURLの場合はYoutubeOembedClientから取得しOgpFetcherは呼ばれない`() {
        val url = "https://www.youtube.com/watch?v=xxxx"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns true
        every { youtubeOembedClient.fetch(url) } returns
            OembedResult(title = "肉じゃがの作り方", thumbnailUrl = "https://i.ytimg.com/vi/xxxx/hqdefault.jpg")

        val response = service.fetch(url)

        assertEquals("肉じゃがの作り方", response.title)
        assertEquals("https://i.ytimg.com/vi/xxxx/hqdefault.jpg", response.thumbnailUrl)
        verify(exactly = 0) { ogpFetcher.fetch(any()) }
    }

    @Test
    fun `YouTube以外のURLの場合はOgpFetcherから取得しYoutubeOembedClientのfetchは呼ばれない`() {
        val url = "https://cookpad.com/recipe/9999"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns false
        every { ogpFetcher.fetch(url) } returns
            OgpResult(title = "肉じゃが", thumbnailUrl = "https://cookpad.com/thumbnail.jpg")

        val response = service.fetch(url)

        assertEquals("肉じゃが", response.title)
        assertEquals("https://cookpad.com/thumbnail.jpg", response.thumbnailUrl)
        verify(exactly = 0) { youtubeOembedClient.fetch(any()) }
    }

    @Test
    fun `取得元が例外を投げた場合はMetadataFetchExceptionが伝播する`() {
        val url = "https://cookpad.com/recipe/9999"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns false
        every { ogpFetcher.fetch(url) } throws MetadataFetchException("情報を取得できませんでした。手動で入力してください")

        assertThrows<MetadataFetchException> { service.fetch(url) }
    }

    @Test
    fun `YouTubeのURLでoEmbedが失敗した場合はOgpFetcherにフォールバックする`() {
        val url = "https://www.youtube.com/watch?v=xxxx"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns true
        every { youtubeOembedClient.fetch(url) } throws MetadataFetchException("情報を取得できませんでした。手動で入力してください")
        every { ogpFetcher.fetch(url) } returns
            OgpResult(title = "肉じゃがの作り方", thumbnailUrl = "https://i.ytimg.com/vi/xxxx/maxresdefault.jpg")

        val response = service.fetch(url)

        assertEquals("肉じゃがの作り方", response.title)
        assertEquals("https://i.ytimg.com/vi/xxxx/maxresdefault.jpg", response.thumbnailUrl)
    }

    @Test
    fun `YouTubeのURLでoEmbed-OGPどちらも失敗した場合はMetadataFetchExceptionを投げる`() {
        val url = "https://www.youtube.com/watch?v=xxxx"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns true
        every { youtubeOembedClient.fetch(url) } throws MetadataFetchException("情報を取得できませんでした。手動で入力してください")
        every { ogpFetcher.fetch(url) } throws MetadataFetchException("情報を取得できませんでした。手動で入力してください")

        assertThrows<MetadataFetchException> { service.fetch(url) }
    }

    @Test
    fun `http-https以外のスキームの場合はMetadataFetchExceptionを投げる`() {
        assertThrows<MetadataFetchException> { service.fetch("file:///etc/passwd") }
        verify(exactly = 0) { youtubeOembedClient.isYoutubeUrl(any()) }
    }

    @Test
    fun `前後に空白が入っていてもtrimしてから判定・取得する`() {
        val url = "https://www.youtube.com/watch?v=xxxx"
        every { youtubeOembedClient.isYoutubeUrl(url) } returns true
        every { youtubeOembedClient.fetch(url) } returns
            OembedResult(title = "肉じゃがの作り方", thumbnailUrl = "https://i.ytimg.com/vi/xxxx/hqdefault.jpg")

        val response = service.fetch("  $url  ")

        assertEquals("肉じゃがの作り方", response.title)
        verify(exactly = 1) { youtubeOembedClient.isYoutubeUrl(url) }
        verify(exactly = 1) { youtubeOembedClient.fetch(url) }
    }
}
