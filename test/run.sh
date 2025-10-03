ls -l 
pwd
env
ls -l /
ls -l /mnt

cat /start.sh || echo 0

./llama-cli -m  qwen2.5-0.5b-instruct-q4_k_m.gguf  -p "tell a joke" || echo 0
