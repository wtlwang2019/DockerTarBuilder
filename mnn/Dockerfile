# FROM ubuntu:22.04


# WORKDIR /llm
# # 下载MNN源码
# RUN git clone https://github.com/alibaba/MNN.git

# # 编译
# RUN cd MNN
# RUN mkdir build && cd build
# RUN cmake .. -DMNN_LOW_MEMORY=true -DMNN_CPU_WEIGHT_DEQUANT_GEMM=true -DMNN_BUILD_LLM=true -DMNN_SUPPORT_TRANSFORMER_FUSE=true
# RUN make -j

# # 运行
# ./llm_demo /path/to/Qwen3-VL-2B-Instruct-MNN/config.json prompt.txt


# ---------- Builder 阶段 ----------
FROM ubuntu:22.04 AS builder

# 设置非交互式安装，避免 tzdata 等交互提示
ENV DEBIAN_FRONTEND=noninteractive

# 一次性安装编译所需工具
#   git、gcc/g++、cmake、make、curl、ca‑certificates 等
RUN apt-get update && apt-get install -y --no-install-recommends git build-essential cmake curl  ca-certificates libopencv-dev &&  rm -rf /var/lib/apt/lists/*

# 工作目录
WORKDIR /opt

# 克隆 MNN 源码（使用官方仓库的最新 master）
RUN git clone https://github.com/alibaba/MNN.git

# 编译
WORKDIR /opt/MNN
RUN mkdir -p build && cd build && cmake .. -DMNN_LOW_MEMORY=true -DMNN_CPU_WEIGHT_DEQUANT_GEMM=true -DMNN_BUILD_LLM=true -DMNN_SUPPORT_TRANSFORMER_FUSE=true -DMNN_BUILD_LLM_OMNI=true \
    -DMNN_OPENCV_TEST=ON -DMNN_IMGCODECS=ON -DMNN_OPENCV_BENCH=ON   && \
    make -j$(nproc)

# 设置默认工作目录
WORKDIR /opt/MNN/build

# # ---------- Runtime 阶段 ----------
FROM ubuntu:22.04

# 只保留运行时需要的库（根据实际需求可自行裁剪）
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6  ca-certificates libopencv-core4.5d libopencv-imgcodecs4.5d libopencv-imgproc4.5d   &&  rm -rf /var/lib/apt/lists/*

# 将编译好的文件拷贝到运行时镜像
COPY --from=builder /opt/MNN/build /opt/MNN/build

# 设置默认工作目录
WORKDIR /opt/MNN/build

# 入口（根据实际可执行文件自行修改）
CMD ["./llm_bench", "--help"]
