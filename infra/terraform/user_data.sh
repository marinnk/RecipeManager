#!/bin/bash
# EC2の初回起動時に実行される。Docker・Docker Composeを使える状態にしておくことで、
# Issue #42（初回デプロイ）ではアプリのデプロイ作業だけに集中できるようにする。
set -eux

dnf update -y
dnf install -y docker git

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Amazon Linux 2023のdnfリポジトリにはDocker Composeプラグインが無いため、手動で配置する
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
