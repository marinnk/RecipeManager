# フロントエンドコードを読むためのメモ（自分用）

レシピ登録画面（`frontend/src/app/recipes/new/`）を読んだときに出てきた、Reactの実装で何度も繰り返し出てくる書き方のパターンをまとめたもの。忘れたらここを見返す。

## パターン1: `useState`のペア

```ts
const [title, setTitle] = useState("");
```

- `title` … 今画面が覚えている値そのもの
- `setTitle` … その値を書き換えるための専用の関数

`setTitle(...)`を呼ぶと値が変わり、画面が自動で描き直される。ただの変数に代入するだけでは画面は更新されない。

## パターン2: `value` + `onChange` のセット

入力欄には必ずこの2つがセットで書かれている。

```tsx
<input
  value={title}                              // 表示する内容＝覚えている値
  onChange={(e) => setTitle(e.target.value)} // 打たれるたびに覚えている値を更新
/>
```

片方だけでは動かない（表示だけで入力を反映できない、または反映だけで表示に出ない）。

## パターン3: `map`で一覧を描く

```tsx
{tags.map((tag) => (
  <span key={tag}>{tag}</span>
))}
```

配列の中身を1つずつ、画面のパーツに変換している。Javaの`stream().map()`に近い。

## 登録ボタンを押したときの流れ（全体像）

```
画面（RecipeRegisterForm）
  → 橋渡し役（useCreateRecipe）
    → 通信担当（lib/api/recipes.ts）
      → next.config.tsの転送設定
        → バックエンド（Spring Boot）
```

わからなくなったら、この順番でファイルを開いて追いかけると迷わない。
