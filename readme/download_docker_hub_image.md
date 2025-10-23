
## 1. 查找镜像（web页面）
`https://hub.docker.com/search?q=llama.cpp&type=image&architecture=arm64&operating_system=linux`

例如：https://hub.docker.com/search?q=llama.cpp&type=image&architecture=arm64&operating_system=linux

API接口：

`https://hub.docker.com/search.data?q=<query>&type=image&architecture=arm64&operating_system=linux&page_size=50&sort=pull_count&order=desc&_routes=routes%2F_layout.search`

例如：https://hub.docker.com/search.data?q=llama.cpp&type=image&architecture=arm64&operating_system=linux&page_size=50&sort=pull_count&order=desc&_routes=routes%2F_layout.search


## 2.查看镜像的具体信息

`https://hub.docker.com/v2/repositories/<image>`

例如：
https://hub.docker.com/v2/repositories/amperecomputingai/llama.cpp
