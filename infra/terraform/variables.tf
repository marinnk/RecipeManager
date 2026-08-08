variable "aws_region" {
  description = "リソースを作成するAWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "my_ip" {
  description = "EC2へのSSH接続を許可する自分のグローバルIPアドレス（CIDR無しの形式。例: 203.0.113.1）。`curl https://checkip.amazonaws.com` で確認できる"
  type        = string
}

variable "ssh_public_key_path" {
  description = "EC2に登録するSSH公開鍵のパス"
  type        = string
  default     = "~/.ssh/recipemanager_ec2.pub"
}

variable "db_name" {
  description = "RDS上に作成するデータベース名"
  type        = string
  default     = "recipemanager"
}

variable "db_username" {
  description = "RDSの接続ユーザー名"
  type        = string
  default     = "recipemanager"
}

variable "db_password" {
  description = "RDSの接続パスワード（Gitには含めず、terraform.tfvarsなど別ファイルで指定する）"
  type        = string
  sensitive   = true
}

variable "budget_limit_usd" {
  description = "AWS Budgetsで設定する月間予算上限（USD）。無料枠超過に早期に気づくための目安なので少額でよい"
  type        = number
  default     = 5
}

variable "budget_alert_email" {
  description = "予算アラートの通知先メールアドレス"
  type        = string
  default     = "mario.libaty@gmail.com"
}
