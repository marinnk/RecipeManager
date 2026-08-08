# docs/basic-design.md「2. システム構成図」に対応
# CloudFrontのオリジンはfrontend（Next.js, :3000）のみ。"/api/*" はNext.js側のrewrites設定
# （frontend/next.config.ts）でbackend（Spring Boot, :8080）へ内部転送される。
# backendをCloudFrontから直接呼び出さないのは、EC2のセキュリティグループでCloudFrontの
# マネージドプレフィックスリスト（IPレンジ）を2ポート分登録すると、1セキュリティグループ
# あたりのルール数上限を超えてしまうため（詳細はsecurity_groups.tfのコメント参照）。
# 副次的に、backendを外部に一切公開しなくて済むというメリットもある。

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "RecipeManager"
  price_class     = "PriceClass_200" # 主な利用者が日本国内のため、アジアのエッジロケーションを含める

  origin {
    domain_name = local.ec2_public_dns
    origin_id   = "frontend"

    custom_origin_config {
      http_port              = 3000
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # "/api/*" もこのビヘイビアを通り、Next.jsのrewritesでbackendへ転送される。
  # 静的ページとAPIレスポンスが混在するため、CloudFront側ではキャッシュしない
  default_cache_behavior {
    target_origin_id       = "frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    # アプリの内容やAPIレスポンスが即座に反映されるよう、CloudFront側ではキャッシュしない
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # 独自ドメインを取得しないため、CloudFront標準の証明書をそのまま使う（ACM証明書は発行不要）
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "recipemanager-cloudfront"
  }
}
