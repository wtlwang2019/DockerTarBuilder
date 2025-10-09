#FROM yusiwen/llama.cpp:b4302
FROM amperecomputingai/llama.cpp:latest


RUN curl -L -O https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf

ENTRYPOINT ["/bin/bash","-c"]
CMD ["echo it is arm64 llama_cpp, entrypoint is ['/bin/bash', '-c']"]



