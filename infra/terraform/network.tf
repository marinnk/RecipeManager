# docs/basic-design.md「7.1 VPC・ネットワーク構成」に対応

resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "recipemanager-vpc"
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "recipemanager-igw"
  }
}

# EC2・RDSが実際に使うパブリックサブネット（設計書の「10.0.1.0/24」に対応）
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "recipemanager-public-a"
  }
}

# RDSのDBサブネットグループは異なる2つ以上のAZにまたがるサブネットが必須というAWS側の制約が
# あるため、単一AZ構成の方針は変えずに、この2つ目のサブネットはRDSのサブネットグループ登録
# のためだけに用意する（EC2はpublic_aにのみ配置する）
resource "aws_subnet" "public_c" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = {
    Name = "recipemanager-public-c"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "recipemanager-public-rt"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_c" {
  subnet_id      = aws_subnet.public_c.id
  route_table_id = aws_route_table.public.id
}
