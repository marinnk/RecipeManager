# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# public/ ディレクトリが存在しない場合、後段のCOPYで失敗しないよう空でも作っておく
RUN mkdir -p public
# next.config.ts の rewrites destination は `next build` 時に読み込まれ、standalone出力に
# 焼き込まれる（実行時に環境変数を変えても反映されない）ため、ビルド時に渡す必要がある
ARG BACKEND_INTERNAL_URL=http://localhost:8080
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
RUN npm run build

# ---- Run stage ----
# next.config.ts の output: "standalone" により生成される最小構成のサーバーのみを含める
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
