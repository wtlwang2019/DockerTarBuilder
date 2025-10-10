FROM samueltallet/alpine-llama-cpp-server:latest

# 创建软链接，使得 /usr/bin/bash 指向 /bin/sh
RUN ln -sf /bin/sh /usr/bin/bash
