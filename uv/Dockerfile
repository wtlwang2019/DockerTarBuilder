FROM ubuntu:22.04 AS uv

# 设置非交互式安装，避免 tzdata 等交互提示
ENV DEBIAN_FRONTEND=noninteractive

# 一次性安装编译所需工具
#  curl、ca‑certificates 等
RUN apt-get update && apt-get install -y --no-install-recommends  curl  ca-certificates  &&  rm -rf /var/lib/apt/lists/*

# 工作目录
WORKDIR /opt

# 官方一键安装命令（Linux/macOS通用）
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
RUN source $HOME/.local/bin/env

# 在/opt/python目录下安装python3.10

RUN uv python install 3.10 --path /opt/python/3.10
