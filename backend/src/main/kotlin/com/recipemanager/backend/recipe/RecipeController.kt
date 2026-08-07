package com.recipemanager.backend.recipe

import com.recipemanager.backend.recipe.dto.RecipeCreateRequest
import com.recipemanager.backend.recipe.dto.RecipeResponse
import com.recipemanager.backend.recipe.dto.RecipeUpdateRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/recipes")
class RecipeController(
    private val recipeService: RecipeService,
) {
    @GetMapping
    fun list(): ResponseEntity<List<RecipeResponse>> = ResponseEntity.ok(recipeService.findAll())

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: Long,
    ): ResponseEntity<RecipeResponse> = ResponseEntity.ok(recipeService.findById(id))

    @PostMapping
    fun create(
        @Valid @RequestBody request: RecipeCreateRequest,
    ): ResponseEntity<RecipeResponse> {
        val response = recipeService.create(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: RecipeUpdateRequest,
    ): ResponseEntity<RecipeResponse> = ResponseEntity.ok(recipeService.update(id, request))

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        recipeService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
