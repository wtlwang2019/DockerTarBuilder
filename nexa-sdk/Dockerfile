FROM ubuntu:22.04

RUN curl -fsSL https://github.com/NexaAI/nexa-sdk/releases/latest/download/nexa-cli_linux_x86_64.sh -o install.sh && chmod +x install.sh && ./install.sh && rm install.sh

RUN nexa -h

# nexa pull NexaAIDev/Qwen3-VL-2B-Instruct-GGUF
