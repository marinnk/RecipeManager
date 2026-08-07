package com.recipemanager.backend.recipe

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface RecipeRepository : JpaRepository<Recipe, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<Recipe>

    // タイトルのキーワード検索とタグ絞り込み（AND条件）を同時に行うクエリ。
    // タグは中間テーブルとのJOINで一旦レコードが分裂するため、GROUP BYで1レシピ1行に戻し、
    // HAVINGで「選択したタグが過不足なく全部揃っているか」をタグ数の一致で判定している。
    // keyword/tagsが指定されていない場合はそれぞれの条件をtagCount=0などでバイパスする。
    @Query(
        """
        SELECT r FROM Recipe r
        LEFT JOIN r.tags t
        WHERE (:keyword IS NULL OR r.title LIKE CONCAT('%', :keyword, '%'))
        AND (:tagCount = 0 OR t.name IN :tags)
        GROUP BY r
        HAVING :tagCount = 0 OR COUNT(DISTINCT t.name) = :tagCount
        ORDER BY r.createdAt DESC
        """,
    )
    fun search(
        @Param("keyword") keyword: String?,
        @Param("tags") tags: List<String>,
        @Param("tagCount") tagCount: Long,
    ): List<Recipe>
}
