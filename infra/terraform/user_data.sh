#!/bin/bash
# EC2の初回起動時に実行される。Docker・Docker Composeを使える状態にしておくことで、
# Issue #42（初回デプロイ）ではアプリのデプロイ作業だけに集中できるようにする。
set -eux

dnf update -y
dnf install -y docker git

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# t3.microはメモリが916MBしかなく、Amazon Linux 2023のデフォルト設定では
# （メモリが800MB超のインスタンスはzram-swapの対象外のため）スワップが一切無い。
# backend（Gradle）・frontend（Next.js）のDockerイメージビルドでメモリを使い切り、
# OOM状態でSSHごと応答しなくなる事象が実際に発生したため、スワップファイルを追加する
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

# Amazon Linux 2023のdnfリポジトリにはDocker Composeプラグインが無いため、手動で配置する
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# dnfのdocker-buildx-pluginは古く（0.12系）、`docker compose build`が要求する0.17以降を
# 満たさないため、最新版で上書きする
BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/buildx/releases/latest/download/buildx-${BUILDX_VERSION}.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
