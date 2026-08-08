# docs/basic-design.md「2. システム構成図」に対応
# パスに応じて frontend（Next.js, :3000）と backend（Spring Boot, :8080）へ振り分ける

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

  origin {
    domain_name = local.ec2_public_dns
    origin_id   = "backend"

    custom_origin_config {
      http_port              = 8080
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # "/" 配下（デフォルト）→ Next.js
  default_cache_behavior {
    target_origin_id       = "frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    # アプリの内容が更新されてもすぐ反映されるよう、CloudFront側ではキャッシュしない
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # "/api/*" 配下 → Spring Boot
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "backend"
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

    # レシピの登録・更新・削除を即座に反映させるため、APIレスポンスはキャッシュしない
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
