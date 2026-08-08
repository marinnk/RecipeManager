output "ec2_public_ip" {
  description = "EC2のElastic IP（SSH接続などに使う）"
  value       = aws_eip.this.public_ip
}

output "ec2_public_dns" {
  description = "EC2のパブリックDNS名（CloudFrontのオリジンに使っているもの）"
  value       = local.ec2_public_dns
}

output "cloudfront_domain_name" {
  description = "アプリの公開URL（https://<この値>/）"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "rds_endpoint" {
  description = "RDSのエンドポイント（EC2上のbackendコンテナの環境変数 DB_HOST に設定する）"
  value       = aws_db_instance.this.address
}
