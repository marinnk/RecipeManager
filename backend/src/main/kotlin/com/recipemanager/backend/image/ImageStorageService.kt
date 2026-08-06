package com.recipemanager.backend.image

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.util.UUID

@Service
class ImageStorageService(
    @Value("\${app.upload.dir}") private val uploadDir: String,
) {
    fun store(file: MultipartFile): String {
        if (file.isEmpty) {
            throw InvalidImageFileException("画像ファイルを選択してください")
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw InvalidImageFileException("画像ファイルは${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB以下にしてください")
        }
        val extension = extensionFor(file.contentType)

        val filename = "${UUID.randomUUID()}.$extension"
        val root = Paths.get(uploadDir).toAbsolutePath().normalize()
        Files.createDirectories(root)
        file.transferTo(root.resolve(filename))

        return "$URL_PREFIX/$filename"
    }

    private fun extensionFor(contentType: String?): String =
        ALLOWED_CONTENT_TYPES[contentType]
            ?: throw InvalidImageFileException("jpeg・png・webp形式の画像のみアップロードできます")

    companion object {
        private const val MAX_FILE_SIZE_BYTES = 8L * 1024 * 1024
        private const val URL_PREFIX = "/api/uploads"
        private val ALLOWED_CONTENT_TYPES =
            mapOf(
                "image/jpeg" to "jpg",
                "image/png" to "png",
                "image/webp" to "webp",
            )
    }
}
