package com.recipemanager.backend.common.error

import com.recipemanager.backend.image.InvalidImageFileException
import com.recipemanager.backend.metadata.MetadataFetchException
import com.recipemanager.backend.recipe.RecipeNotFoundException
import com.recipemanager.backend.tag.InvalidTagException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException

@RestControllerAdvice
class GlobalExceptionHandler {
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationError(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val message =
            ex.bindingResult.fieldErrors
                .firstOrNull()
                ?.defaultMessage ?: "入力値が不正です"
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(error = "VALIDATION_ERROR", message = message))
    }

    @ExceptionHandler(InvalidImageFileException::class)
    fun handleInvalidImageFile(ex: InvalidImageFileException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(error = "VALIDATION_ERROR", message = ex.message ?: "画像が不正です"))

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleMaxUploadSizeExceeded(ex: MaxUploadSizeExceededException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(error = "VALIDATION_ERROR", message = "画像ファイルは8MB以下にしてください"))

    @ExceptionHandler(InvalidTagException::class)
    fun handleInvalidTag(ex: InvalidTagException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(error = "VALIDATION_ERROR", message = ex.message ?: "タグが不正です"))

    @ExceptionHandler(RecipeNotFoundException::class)
    fun handleRecipeNotFound(ex: RecipeNotFoundException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(error = "NOT_FOUND", message = ex.message ?: "レシピが見つかりません"))

    @ExceptionHandler(MetadataFetchException::class)
    fun handleMetadataFetchFailed(ex: MetadataFetchException): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ErrorResponse(error = "METADATA_FETCH_FAILED", message = ex.message ?: "情報を取得できませんでした"))

    // DB制約違反やNPEなど、上記のどのハンドラにも該当しない想定外の例外を最後に拾う。
    // Springの標準エラーレスポンスはmessageフィールドを含まないことが多く、
    // フロントのApiErrorが前提とするErrorResponse形式（error/message）と噛み合わないため、
    // ここで形式を揃える。詳細はログにのみ出力し、クライアントには汎用メッセージだけを返す
    // （スタックトレース等の内部情報を露出させないため）。
    @ExceptionHandler(Exception::class)
    fun handleUnexpectedError(ex: Exception): ResponseEntity<ErrorResponse> {
        logger.error("想定外のエラーが発生しました", ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse(error = "INTERNAL_SERVER_ERROR", message = "予期しないエラーが発生しました。時間をおいて再度お試しください。"))
    }
}
