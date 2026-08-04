# RecipeManager

YouTubeやレシピサイトに掲載されているレシピを、自分用にブックマークして管理できるアプリ。気に入ったレシピへのリンクを、サムネイル画像・メモ・タグと一緒に保存しておける、個人用のレシピブックマークアプリです（レシピの材料・作り方自体を作成・編集する機能ではありません）。

スクールの課題として開発しており、以前の課題（Java + Spring Boot / React + TypeScript）とは異なる技術スタックを使い、AWSの無料枠に収まる構成にすることが条件です。

## 技術スタック

| レイヤー | 採用技術 |
|----------|----------|
| バックエンド | Kotlin + Spring Boot |
| フロントエンド | Next.js + TypeScript |
| データベース | MySQL |
| インフラ | AWS + Docker + Terraform |

## ドキュメント

- [要件定義書](docs/requirements.md) — 何を作るか・なぜ作るか
- [基本設計書](docs/basic-design.md) — どう作るか（技術スタック、構成図、画面設計、データ設計、API設計など）
- [用語集](docs/glossary.md) — インフラ・クラウド関連の用語まとめ
- [フロントエンド読み方メモ](docs/frontend-reading-notes.md) — Reactコードの読み方パターン（自分用）

## セットアップ

### 前提

- Java 21
- Node.js 22
- Docker Desktop

### 手順

```sh
# 1. 環境変数ファイルを用意する
cp .env.example .env

# 2. DB（MySQL）を起動する
docker compose up -d db

# 3. バックエンド（Spring Boot）を起動する
cd backend
./gradlew bootRun
# → http://localhost:8080

# 4. フロントエンド（Next.js）を起動する（別ターミナル）
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### テスト・Lint

```sh
# バックエンド
cd backend
./gradlew ktlintCheck
./gradlew test

# フロントエンド
cd frontend
npm run lint
npm run test
```
