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

        // 元のファイル名（例: photo.jpg）はそのまま使わず、UUIDで採番する。
        // スマホのカメラは連番でファイル名を付けるため、機種変更等で同じファイル名が
        // 再度アップロードされることがある。元のファイル名をそのまま保存先に使うと、
        // transferTo()は既存ファイルがあっても無警告で上書きしてしまうため、
        // 別のレシピの画像が後から書き換えられてしまう（エラーにはならず、
        // 一覧画面で気づかないうちに違う画像が表示されるようになる）。
        val filename = "${UUID.randomUUID()}.$extension"
        val root = Paths.get(uploadDir).toAbsolutePath().normalize()
        Files.createDirectories(root)
        file.transferTo(root.resolve(filename))

        return "$URL_PREFIX/$filename"
    }

    fun delete(url: String) {
        // store()が返すURL形式（"/api/uploads/xxx"）以外は想定外の呼び出しとして何もしない。
        if (!url.startsWith("$URL_PREFIX/")) return

        val filename = url.removePrefix("$URL_PREFIX/")
        val root = Paths.get(uploadDir).toAbsolutePath().normalize()
        Files.deleteIfExists(root.resolve(filename))
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
