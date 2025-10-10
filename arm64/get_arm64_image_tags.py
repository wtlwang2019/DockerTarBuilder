# 导入 Python 官方内置库
import urllib.request  # 处理 HTTP 请求
import urllib.error  # 捕获请求错误（如网络异常、404/500 错误）
import json

def download_url_content(url, save_path):
    """
    使用官方库下载 URL 内容并保存到本地
    :param url: 目标 URL（如 Docker Hub 接口）
    :param save_path: 本地保存路径（如 "./docker_tags.json"）
    """
    # 1. 发起 HTTP GET 请求（可添加请求头模拟浏览器，避免部分网站拦截）
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    request = urllib.request.Request(url, headers=headers)  # 构造请求对象（带 headers）

    try:
        # 2. 发送请求并获取响应
        with urllib.request.urlopen(request) as response:
            # 验证请求是否成功（HTTP 状态码 200 表示成功）
            if response.getcode() == 200:
                # 3. 读取响应内容（目标 URL 返回 JSON，用 utf-8 解码文本）
                content = response.read().decode("utf-8")
                print(f"请求成功！响应内容长度：{len(content)} 字符")

                # 4. 保存内容到本地文件（用 with 自动管理文件句柄，避免资源泄漏）
                with open(save_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"内容已保存到：{save_path}")
            else:
                print(f"请求失败！HTTP 状态码：{response.getcode()}")

    # 捕获常见错误（网络异常、URL 无效、服务器错误等）
    except urllib.error.URLError as e:
        print(f"URL 错误：{e.reason}")
    except urllib.error.HTTPError as e:
        print(f"HTTP 错误：状态码 {e.code}，原因：{e.reason}")
    except Exception as e:
        print(f"其他错误：{str(e)}")
    return content

def parse_dockerhub_tag_json_result(json_str):
    dic = json.loads(json_str)
    res = []
    next_url = dic['next']
    for item in dic['results']:
        images = item['images']
        arm64_images = [image for image in images if image['architecture']=='arm64']
        if arm64_images:
            res.append(item)
    return res, next_url

def get_arm64_images(image_id: str):
    target_url = f"https://registry.hub.docker.com/v2/repositories/{image_id}/tags?page=1&page_size=100"
    save_path = "{}.docker_tags.json".format(image_id.replace("/", '_'))
    arm64_images_list = []
    res, next_url = parse_dockerhub_tag_json_result(download_url_content(target_url, save_path))
    arm64_images_list.extend(res)
    while len(arm64_images_list) < 20 and next_url:
        res, next_url = parse_dockerhub_tag_json_result(download_url_content(next_url, save_path))
        arm64_images_list.extend(res)
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(arm64_images_list))

# ------------------- 调用函数 -------------------
if __name__ == "__main__":
    # 目标 URL（Docker Hub 仓库标签接口）
    # target_url = "https://hf-mirror.com/Qwen/Qwen2.5-0.5B-Instruct-GGUF/tree/main"
    # image_id = 'yusiwen/llama.cpp'
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("image_id", type=str, help="docker的镜像id, 例如：yusiwen/llama.cpp")
    args = parser.parse_args()
    image_id = args.image_id
    if '/' not in image_id:
        image_id = 'library/'+image_id    

    # 本地保存路径（如当前目录下的 docker_llama_tags.json）
    get_arm64_images(image_id)
