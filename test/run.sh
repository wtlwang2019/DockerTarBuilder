echo "ls -l" && ls -l 
echo "pwd" && pwd
env
ls -l /
echo "ls /app"
ls -l /app  || echo 0
ls -l /mnt

echo "ls -l /bin" && ls -l /bin
echo "ls -l /usr/bin" && ls -l /usr/bin
ls -l /usr/local/bin

cat /start.sh || echo 0

./llama-cli -m  qwen2.5-0.5b-instruct-q4_k_m.gguf  -p "tell a joke" || echo 0
