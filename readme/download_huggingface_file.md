## 说明

### 1. 先获取huggingface的modelId

可以用api接口查询：https://huggingface.co/api/models?search=qwen


### 2. 获取指定modelId下模型文件列表

curl -s https://huggingface.co/api/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF

### 3. 下载文件

https://huggingface.co/<repo>/resolve/<branch>/<filename>?download=true

https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true
