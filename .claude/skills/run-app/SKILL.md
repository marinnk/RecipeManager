---
name: run-app
description: Start the backend (Spring Boot) and frontend (Next.js) dev servers for local verification. Use whenever you need to run/launch/preview the app, take a screenshot, or manually confirm a change works end-to-end.
---

# アプリの起動手順

このプロジェクトを実際に動かして確認するときは、必ずこの手順に従うこと。

## 前提: ポートは固定。競合したら「別ポートで動かす」のは禁止

- バックエンド（Spring Boot）: 必ず **8080**
- フロントエンド（Next.js）: 必ず **3000**
- DB（MySQL / Docker）: 必ず **3306**

ポートが使用中の場合でも、「動いていればOK」ではなく、**指定ポートで動いていることを毎回確認する**こと。別ポートで起動した状態のまま作業を進めない（フロントエンドからバックエンドAPIへの接続先や、バックエンド側のCORS許可オリジンは固定ポート前提になる想定のため、別ポートでは正しく動作しない）。具体的な接続設定（環境変数名など）は開発環境構築のタイミングで確定させる。

## 起動前: ポート競合の確認・解消

起動する前に、対象ポートを使っているプロセスがないか確認し、あれば停止する。

```sh
# 例: 8080番ポートを使っているプロセスを止める
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill

# 例: 3000番ポートを使っているプロセスを止める
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

`rm`はこのプロジェクトの`.claude/settings.json`で禁止されているのと同様、`kill -9`も禁止されている。まずは通常の`kill`（SIGTERM）で止め、それでも残る場合はユーザーに相談する。

## 起動手順

```sh
# 1. DB（初回 or 停止している場合のみ）
docker compose up -d db

# 2. バックエンド（別ターミナル/バックグラウンド）
cd backend
./gradlew bootRun

# 3. フロントエンド（別ターミナル/バックグラウンド）
cd frontend
npm run dev
```

## 起動後の確認

```sh
# バックエンドが8080で応答しているか
curl -s http://localhost:8080/api/recipes

# フロントエンドが3000で応答しているか
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

いずれかが期待するポートで応答しない場合は、そのポートを使っている別プロセスがいないか再度`lsof`で確認し、止めてから起動し直す。「一時的に別のポートで動かして確認する」という代替策は取らない。

## ブラウザでの見た目確認（任意）

`chromium-cli`が使えない場合、`playwright-core` + ローカルのGoogle Chromeで代替できる:

```sh
npm install playwright-core   # スクラッチディレクトリ等、一時的な場所で
```

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
```
