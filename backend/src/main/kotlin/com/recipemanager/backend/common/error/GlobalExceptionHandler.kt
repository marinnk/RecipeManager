package com.recipemanager.backend.common.error

import com.recipemanager.backend.image.InvalidImageFileException
import com.recipemanager.backend.metadata.MetadataFetchException
import com.recipemanager.backend.recipe.RecipeNotFoundException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException

@RestControllerAdvice
class GlobalExceptionHandler {
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
}
