FROM samueltallet/alpine-llama-cpp-server:latest

# 创建软链接，使得 /usr/bin/bash 指向 /bin/sh;  此法不通
# RUN ln -sf /bin/sh /usr/bin/bash

# 1. 更新索引（可选）
RUN apk update

# 2. 安装 bash
RUN apk add --no-cache bash
