package com.recipemanager.backend.recipe

import com.recipemanager.backend.tag.Tag
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.time.Instant

@Entity
@Table(name = "recipe")
class Recipe(
    @Column(nullable = false, length = 255)
    var title: String,
    // 実際のレシピURLはクエリパラメータ等でデフォルトのvarchar(255)を超えることがあるため、
    // バリデーション側の上限（2048文字、一般的なURLの安全な長さの目安）に合わせて広げてある。
    @Column(length = 2048)
    var url: String? = null,
    @Column(name = "thumbnail_url", length = 2048)
    var thumbnailUrl: String? = null,
    @Column(columnDefinition = "TEXT")
    var memo: String? = null,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "recipe_tag",
        joinColumns = [JoinColumn(name = "recipe_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")],
    )
    var tags: MutableSet<Tag> = mutableSetOf()

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant? = null
}
