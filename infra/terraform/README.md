# RecipeManager インフラ（Terraform）

`docs/basic-design.md` の「7. AWS構成方針」で決めたAWSインフラ（VPC・EC2・RDS・CloudFront・AWS Budgets）をTerraformで構築する。

## 前提

- [Terraform](https://developer.hashicorp.com/terraform) 1.5以上
- [AWS CLI](https://aws.amazon.com/cli/) が設定済みで、対象のAWSアカウントに接続できること（`aws sts get-caller-identity` で確認できる）
- EC2への接続用SSH鍵ペア（無ければ `ssh-keygen -t ed25519 -f ~/.ssh/recipemanager_ec2 -N ""` で作成する）

## 使い方

```sh
cd infra/terraform

# 初回のみ: 変数ファイルを用意する
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を開き、my_ip・db_password・budget_alert_email などを実際の値に書き換える

terraform init

# 何が作られる/変わるかを確認する（実際には何も作成しない）
terraform plan

# 実際にAWS上にリソースを作成する（課金が発生するため内容をよく確認してから実行する）
terraform apply
```

`terraform apply` が完了すると、EC2のパブリックIP・CloudFrontの公開URLなどが出力される（`terraform output` でいつでも再表示できる）。

## リソースを削除する

学習用途で使い終わった後などにインフラを削除する場合:

```sh
terraform destroy
```

## 注意事項

- `terraform.tfvars`（実際の値が入ったファイル）はGitに含めない（`.gitignore`済み）。DBパスワードなどの機密情報が含まれるため
- `my_ip` は自分のグローバルIPアドレス。自宅のIPアドレスは変わることがあるため、SSH接続できなくなった場合は `curl https://checkip.amazonaws.com` で再確認し、`terraform.tfvars` を更新して `terraform apply` し直す
