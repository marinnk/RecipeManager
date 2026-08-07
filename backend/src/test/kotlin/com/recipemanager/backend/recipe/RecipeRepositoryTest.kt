package com.recipemanager.backend.recipe

import com.recipemanager.backend.tag.Tag
import com.recipemanager.backend.tag.TagRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest

// search()はGROUP BY/HAVINGを使った集計クエリのため、MockKによるサービス層のテストだけでは
// クエリ自体の正しさを検証できない。実際のDB（H2）に対して動かして確認する。
@DataJpaTest
class RecipeRepositoryTest {
    @Autowired
    private lateinit var recipeRepository: RecipeRepository

    @Autowired
    private lateinit var tagRepository: TagRepository

    @Test
    fun `キーワードでタイトルを部分一致検索できる`() {
        recipeRepository.save(Recipe(title = "肉じゃが"))
        recipeRepository.save(Recipe(title = "カレーライス"))

        val result = recipeRepository.search("じゃが", emptyList(), 0L)

        assertEquals(listOf("肉じゃが"), result.map { it.title })
    }

    @Test
    fun `選択した全てのタグを持つレシピのみAND条件でヒットする`() {
        val washoku = tagRepository.save(Tag(name = "和食"))
        val jitan = tagRepository.save(Tag(name = "時短"))
        val youshoku = tagRepository.save(Tag(name = "洋食"))
        recipeRepository.save(Recipe(title = "肉じゃが").apply { tags = mutableSetOf(washoku, jitan) })
        recipeRepository.save(Recipe(title = "味噌汁").apply { tags = mutableSetOf(washoku) })
        recipeRepository.save(Recipe(title = "オムライス").apply { tags = mutableSetOf(youshoku, jitan) })

        val result = recipeRepository.search(null, listOf("和食", "時短"), 2L)

        assertEquals(listOf("肉じゃが"), result.map { it.title })
    }

    @Test
    fun `キーワードとタグを両方指定すると両方の条件を満たすレシピのみヒットする`() {
        val washoku = tagRepository.save(Tag(name = "和食"))
        recipeRepository.save(Recipe(title = "肉じゃが").apply { tags = mutableSetOf(washoku) })
        recipeRepository.save(Recipe(title = "カレーライス").apply { tags = mutableSetOf(washoku) })

        val result = recipeRepository.search("肉じゃが", listOf("和食"), 1L)

        assertEquals(listOf("肉じゃが"), result.map { it.title })
    }

    @Test
    fun `キーワード・タグとも未指定なら全件返す`() {
        recipeRepository.save(Recipe(title = "肉じゃが"))
        recipeRepository.save(Recipe(title = "カレーライス"))

        val result = recipeRepository.search(null, emptyList(), 0L)

        assertEquals(2, result.size)
    }

    @Test
    fun `一致するレシピが無いときは空リストを返す`() {
        recipeRepository.save(Recipe(title = "肉じゃが"))

        val result = recipeRepository.search("寿司", emptyList(), 0L)

        assertEquals(emptyList<Recipe>(), result)
    }
}
