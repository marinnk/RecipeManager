package com.recipemanager.backend.image

import com.recipemanager.backend.image.dto.ImageUploadResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/images")
class ImageController(
    private val imageStorageService: ImageStorageService,
) {
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun upload(
        @RequestParam("file") file: MultipartFile,
    ): ResponseEntity<ImageUploadResponse> {
        val url = imageStorageService.store(file)
        return ResponseEntity.status(HttpStatus.CREATED).body(ImageUploadResponse(url))
    }
}
