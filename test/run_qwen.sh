#!/bin/env bash

USER=wtl
set +e   # 关闭错误退出（默认状态）
pwd
ls -l
if ls /test; then
wget https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf
fi
filePath=`pwd`
ls -l /
ls -l /mnt
ls -l /mnt/publish-data/$USER


echo "查看jobs目录"
ls -l -t /mnt/publish-data/$USER/jobs
echo "查看环境变量" && env

echo "查看最近一个jobs下的文件"
job_path="/test"
ls -l -t $job_path

cd "$job_path"
ls -l
echo "检测硬件指令集"
lscpu | grep -i avx  > cpu.txt
lscpu 
echo "test111" > just_test111.txt
mkdir pytorch_output
ls -l
echo "test" > pytorch_output/just_test.txt

ls -l / > pytorch_output/dir.txt
echo "查看/bin目录下的执行文件"
ls -l /bin && ls -l /usr/bin

echo "执行llama-cli进行模型对话"
set +e          # 关闭错误退出（默认状态）
export GGML_DISABLE_AVX=1
export GGML_DISABLE_AVX2=1
export GGML_DISABLE_FMA=1
ps_count=0
## samueltallet
ls /opt && ls /opt/llama.cpp  && cd /opt/llama.cpp
if /opt/llama.cpp/llama-server -h; then
    ls "$filePath/Qwen3-0.6B-Q4_K_M.gguf" && /opt/llama.cpp/llama-server -m "$filePath/Qwen3-0.6B-Q4_K_M.gguf" --host 0.0.0.0 --port 8080 --no-webui  & # > "$job_path/qwen3_server.log" 2>&1 &
    sleep 1
    ps_count=$(ps aux | grep "llama-server" |grep -v grep | wc -l)
    echo "ps_count: $ps_count"
    if [ "$ps_count" -eq 0 ]; then
        nohup /opt/llama.cpp/llama-server -m "$filePath/qwen2.5-0.5b-instruct-q4_k_m.gguf" --host 0.0.0.0 --port 8080 --no-webui  > "$job_path/qwen2.5_server.log" 2>&1 &
    fi
    sleep 1
fi
# 如果服务已启动
ps_count=$(ps aux | grep "llama-server" |grep -v grep | wc -l)
echo "ps_count: $ps_count"
if [ "$ps_count" -gt 0 ]; then
    sleep 3
    wget --help
    for i in $(seq 30)
    do
        wget -q -O - http://127.0.0.1:8080/health
        # 检查上一个命令的退出码，判断是否为 503 (服务器错误)
        exit_code=$?
        if [ $exit_code -eq 0 ]; then
            break
        elif [ $exit_code -eq 8 ]; then
            echo "[$(date)] 服务器返回错误 (可能是 503)，下载失败。"
        else
            echo "[$(date)] 发生未知错误 (退出码: $exit_code)，下载失败。"
        fi
        echo "将在 30 秒后重试..."
        sleep 10
    done
    wget -O -  --post-data "{\"messages\":[{\"role\":\"user\",\"content\":\"tell a joke\"}]}" --header "Content-Type: application/json"  -T 1800 http://127.0.0.1:8080/v1/chat/completions
fi

## yusiwen
ls /llama.cpp && cd /llama.cpp || echo 0
ls /llama.cpp/llama-cli && readelf -h /llama.cpp/llama-cli
/llama.cpp/llama-cli -h
/llama.cpp/llama-cli  -m "$filePath/qwen2.5-0.5b-instruct-q4_k_m.gguf"  -p "who are you?"  -n 2048

## gclub
if ls /llama-server; then
    ls /llama-server && readelf -h /llama-server
    /llama-server -h
    /llama-server -m "$filePath/qwen2.5-0.5b-instruct-q4_k_m.gguf" --host 0.0.0.0 --port 8080 --no-webui  &
fi

## softlang
if ls /app; then
    cd /app || echo 0
    /app/llama-server -h
    /app/llama-server -m "$filePath/qwen2.5-0.5b-instruct-q4_k_m.gguf" --host 0.0.0.0 --port 8080 --no-webui  &
fi

## amperecomputingai
if ls /llm; then
    file /llm/llama-cli
    /llm/llama-server -h
    /llm/llama-cli -h
    /llm/llama-cli -m /llm/qwen2.5-0.5b-instruct-q4_k_m.gguf -p 'what is your name?'
fi


### 最后一部分测试llama-server的推理
# llama-server 没启动的话，直接退出
sleep 3
ps_count=$(ps aux | grep "llama-server" |grep -v grep | wc -l)
echo "ps_count: $ps_count"
if [ "$ps_count" -eq 0 ]; then 
    exit 1
fi

curl http://127.0.0.1:8080/health
if which curl; then
    for i in $(seq 10)
    do
        if curl http://127.0.0.1:8080/health; then
            break
        else
            sleep 30
        fi
    done
    curl http://127.0.0.1:8080/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello"}]}' -m 1200
    sleep 5
    curl -o "$job_path/result.json" http://127.0.0.1:8080/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Who are you? can you speak chinese?"}]}' -m 1200
fi

sleep 3
