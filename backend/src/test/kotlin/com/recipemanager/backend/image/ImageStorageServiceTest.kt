package com.recipemanager.backend.image

import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path

class ImageStorageServiceTest {
    @TempDir
    lateinit var tempDir: Path

    private lateinit var service: ImageStorageService

    @BeforeEach
    fun setUp() {
        service = ImageStorageService(uploadDir = tempDir.toString())
    }

    @Test
    fun `jpeg画像をアップロードすると保存され-api-uploads配下のURLを返す`() {
        val file = MockMultipartFile("file", "photo.jpg", "image/jpeg", "dummy".toByteArray())

        val url = service.store(file)

        assertTrue(url.startsWith("/api/uploads/"))
        assertTrue(url.endsWith(".jpg"))
        assertTrue(Files.exists(tempDir.resolve(url.removePrefix("/api/uploads/"))))
    }

    @Test
    fun `空ファイルのときInvalidImageFileExceptionを投げる`() {
        val file = MockMultipartFile("file", "empty.jpg", "image/jpeg", ByteArray(0))

        assertThrows(InvalidImageFileException::class.java) { service.store(file) }
    }

    @Test
    fun `許可されていないContent-TypeのときInvalidImageFileExceptionを投げる`() {
        val file = MockMultipartFile("file", "note.txt", "text/plain", "hello".toByteArray())

        assertThrows(InvalidImageFileException::class.java) { service.store(file) }
    }

    @Test
    fun `8MBを超えるファイルのときInvalidImageFileExceptionを投げる`() {
        val file = MockMultipartFile("file", "big.jpg", "image/jpeg", ByteArray(9 * 1024 * 1024))

        assertThrows(InvalidImageFileException::class.java) { service.store(file) }
    }

    @Test
    fun `同名のファイルを複数回アップロードしてもファイル名が衝突しない`() {
        val file1 = MockMultipartFile("file", "photo.jpg", "image/jpeg", "a".toByteArray())
        val file2 = MockMultipartFile("file", "photo.jpg", "image/jpeg", "b".toByteArray())

        val url1 = service.store(file1)
        val url2 = service.store(file2)

        assertNotEquals(url1, url2)
    }

    @Test
    fun `保存済みの画像を削除するとファイルが消える`() {
        val file = MockMultipartFile("file", "photo.jpg", "image/jpeg", "dummy".toByteArray())
        val url = service.store(file)
        val path = tempDir.resolve(url.removePrefix("/api/uploads/"))
        assertTrue(Files.exists(path))

        service.delete(url)

        assertTrue(Files.notExists(path))
    }

    @Test
    fun `存在しないファイルを削除しようとしても例外にならない`() {
        service.delete("/api/uploads/${java.util.UUID.randomUUID()}.jpg")
    }

    @Test
    fun `想定外の形式のURLを削除しようとしても例外にならない`() {
        service.delete("https://example.com/photo.jpg")
    }
}
