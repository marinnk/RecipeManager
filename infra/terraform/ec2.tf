# docs/basic-design.md「7.3 主要リソースサイズ」に対応

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "this" {
  key_name   = "recipemanager-ec2"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_instance" "this" {
  ami = data.aws_ami.al2023.id
  # 無料枠対象。AWSアカウントによって無料枠対象のインスタンスタイプが異なり、このアカウントでは
  # t2.microは対象外だったため、`aws ec2 describe-instance-types --filters
  # Name=free-tier-eligible,Values=true` で確認できたt3.microを使う
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = aws_key_pair.this.key_name
  user_data              = file("${path.module}/user_data.sh")

  tags = {
    Name = "recipemanager-ec2"
  }
}

# EC2の再起動でパブリックIPが変わり、CloudFrontのオリジン設定が壊れてしまうのを防ぐための固定IP
resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id

  tags = {
    Name = "recipemanager-eip"
  }
}

locals {
  # Elastic IPには "ec2-<IPをハイフン区切りにしたもの>.<region>.compute.amazonaws.com" という
  # 形式のDNS名が自動で割り当てられる。CloudFrontのオリジンはIPアドレスを直接指定できず
  # ドメイン名が必須なため、この命名規則から逆算して組み立てる
  ec2_public_dns = "ec2-${replace(aws_eip.this.public_ip, ".", "-")}.${var.aws_region}.compute.amazonaws.com"
}
