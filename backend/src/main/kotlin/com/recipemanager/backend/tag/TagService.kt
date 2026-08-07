package com.recipemanager.backend.tag

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TagService(
    private val tagRepository: TagRepository,
) {
    // フィルターUIの選択肢用に、登録済みタグ名を名前順で返す。
    // レシピの絞り込み結果とは独立させ、常に全タグを返すことで、
    // 「タグを選ぶほど選択肢自体が減っていく」という挙動を避けている。
    @Transactional(readOnly = true)
    fun findAll(): List<String> = tagRepository.findAllByOrderByNameAsc().map { it.name }
}
