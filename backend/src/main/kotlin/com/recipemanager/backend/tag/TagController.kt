package com.recipemanager.backend.tag

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/tags")
class TagController(
    private val tagService: TagService,
) {
    @GetMapping
    fun list(): ResponseEntity<List<String>> = ResponseEntity.ok(tagService.findAll())
}
