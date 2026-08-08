resource "aws_db_subnet_group" "this" {
  name       = "recipemanager-db-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_c.id]

  tags = {
    Name = "recipemanager-db-subnet-group"
  }
}

resource "aws_db_instance" "this" {
  identifier     = "recipemanager-db"
  engine         = "mysql"
  engine_version = "8.4"
  instance_class = "db.t3.micro" # 無料枠対象

  allocated_storage = 20 # 無料枠の上限（GB）
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  # サブネット自体はIGWへのルートを持つ「パブリックサブネット」だが、RDSインスタンスに
  # 公開エンドポイントは持たせず、ec2-sgからの3306番のみに閉じる
  publicly_accessible = false

  multi_az                = false # 単一AZ構成（docs/basic-design.md「9. 非機能要件」参照）
  backup_retention_period = 7     # 自動バックアップを有効化（docs/basic-design.md「9. 非機能要件」参照）

  skip_final_snapshot = true # 個人学習用のため、削除時の最終スナップショットは省略する
  deletion_protection = false

  tags = {
    Name = "recipemanager-db"
  }
}
