ls -l 
pwd
env
ls -l /
ls -l /mnt

ls -l /bin
ls -l /usr/bin
ls -l /usr/local/bin

cat /start.sh || echo 0

./llama-cli -m  qwen2.5-0.5b-instruct-q4_k_m.gguf  -p "tell a joke" || echo 0
