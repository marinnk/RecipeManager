# docs/basic-design.md「7.2 セキュリティグループ」に対応

# CloudFrontのオリジン向けIPレンジ一覧（AWSが管理・自動更新してくれるプレフィックスリスト）
# 参照: com.amazonaws.global.cloudfront.origin-facing
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "ec2" {
  name = "ec2-sg"
  # GroupDescriptionはASCII文字のみ許可されるため英語で記載する
  description = "Allow SSH from my IP and app access from CloudFront only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip}/32"]
  }

  # CloudFrontはfrontend(:3000)のみをオリジンとする。backend(:8080)へのアクセスは
  # frontendコンテナがDockerネットワーク内部から呼び出すのみで、外部には公開しない
  # （プレフィックスリストは45件のIPレンジを含み、1ルールあたり1件としてではなく件数分が
  #   セキュリティグループのルール上限（デフォルト60）にカウントされるため、2ポート分登録すると
  #   上限を超過してしまう。1ポートに絞ることで上限内に収める）
  ingress {
    description     = "Next.js (frontend) from CloudFront"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-sg"
  }
}

resource "aws_security_group" "rds" {
  name = "rds-sg"
  # GroupDescriptionはASCII文字のみ許可されるため英語で記載する
  description = "Deny direct DB access except from EC2"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg"
  }
}
