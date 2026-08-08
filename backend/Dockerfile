# ---- Build stage ----
# Gradleでソースをビルドし、実行可能jar（bootJar）を作る
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
# テスト・lintはCI/ローカルで別途実行済みの前提とし、ビルドを高速化するためここではスキップする
RUN ./gradlew bootJar -x test -x ktlintCheck --no-daemon

# ---- Run stage ----
# 実行に必要なJRE・jarファイルのみを含む軽量なイメージにする
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
