package com.recipemanager.backend.metadata

import com.recipemanager.backend.metadata.dto.MetadataFetchRequest
import com.recipemanager.backend.metadata.dto.MetadataFetchResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/metadata")
class MetadataController(
    private val metadataFetchService: MetadataFetchService,
) {
    @PostMapping("/fetch")
    fun fetch(
        @Valid @RequestBody request: MetadataFetchRequest,
    ): ResponseEntity<MetadataFetchResponse> = ResponseEntity.ok(metadataFetchService.fetch(request.url))
}
