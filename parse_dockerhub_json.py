import json
import csv
from typing import List, Dict, Union
from datetime import datetime
import argparse

def parse_key_value_sequence(seq: List, value_idx: int):
    """
    解析“键序号列表+值”的交替序列，返回标准键值字典
    :param seq: 输入的交替序列（如[["_1":2], "root", ["_3":4], "data"]）
    :return: 标准键值字典
    """

    if isinstance(seq[value_idx], str):
        return seq[value_idx]
    if isinstance(seq[value_idx], list):
        return seq[value_idx]
    if isinstance(seq[value_idx], dict):
        result = {}
        for _k,v in seq[value_idx].items():
            if _k.startswith('_'):
                result[seq[int(_k[1:])]] = parse_key_value_sequence(seq, v)
            else:
                continue
        return result
    else:
        return ""

def extract_image_info_from_parsed(parsed_data: Dict, seq: List) -> List[Dict[str, str]]:
    """
    从解析后的标准字典中提取镜像id、created_at、updated_at
    :param parsed_data: 经parse_key_value_sequence处理后的标准字典
    :return: 镜像信息列表
    """
    image_list = []

    # 1. 定位到searchResults（键序号_13对应的值）
    if "routes/_layout.search" not in parsed_data:
        raise KeyError("❌ 未找到routes/_layout.search，数据结构异常")
    search_results = parsed_data["routes/_layout.search"]


    results = search_results["data"]["searchResults"]["results"]
    assert isinstance(results, list), "results 类型错误"
    print(results)

    # 3. 遍历每个镜像数据块，提取目标字段
    for img_idx, img_data_idx in enumerate(results, 1):
        assert isinstance(seq[img_data_idx], dict)
        img_data = {}
        for _k, v in seq[img_data_idx].items():
            k = seq[int(_k[1:])]
            if k in ('id', 'name', 'created_at', 'updated_at', 'short_description', 'pull_count', 'star_count'):
                img_data[k] = seq[v]

        # 提取目标字段（基于键值序号映射）
        # - id：键序号_22或_24对应的值（所有镜像均含这两个键，值相同）
        img_id = img_data.get("id", img_data.get("name", "未获取到id"))
        # - created_at：键序号_28对应的值
        created_at = img_data.get("created_at", "未获取到创建时间")
        # - updated_at：键序号_32对应的值
        updated_at = img_data.get("updated_at", "未获取到更新时间")
        
        # 转换时间格式（ISO 8601→本地时间）
        def convert_time(iso_time: str) -> str:
            if iso_time.startswith("20") and "T" in iso_time:
                try:
                    return datetime.fromisoformat(iso_time.replace("Z", "+00:00")).astimezone().strftime("%Y-%m-%d %H:%M:%S")
                except:
                    return iso_time
            return iso_time

        img_data.update({
            "镜像序号": img_idx,
            "id": img_id,
            "created_at_本地": convert_time(created_at),
            "updated_at_本地": convert_time(updated_at),
            "pull_count": img_data.get('pull_count', 0),
            "star_count": img_data.get('star_count', 0)
        })
        image_list.append(img_data)
    
    print(f"✅ 成功提取{len(image_list)}个镜像信息")
    return image_list

def load_and_parse_raw_file(input_path: str):
    """
    加载原始附件文件并解析为标准键值字典
    :param input_path: 原始文件路径（llama.cpp.search.txt）
    :return: 标准键值字典
    """
    # 1. 读取原始文件
    try:
        with open(input_path, "r", encoding="utf-8") as f:
            # 处理附件中可能的格式问题（如多余的空格、注释）
            raw_content = f.read().strip().replace("<! [CDATA[", "").replace("]]>", "")
            raw_seq = json.loads(raw_content)
        print(f"✅ 成功加载原始文件：{input_path}")
    except FileNotFoundError:
        raise FileNotFoundError(f"❌ 未找到文件：{input_path}，请检查路径")
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"❌ 原始文件JSON解析失败：{str(e)}", doc=input_path, pos=e.pos)
    
    # 2. 解析“键序号+值”序列为标准字典
    try:
        parsed_dict = parse_key_value_sequence(raw_seq, 0)
        print("✅ 成功解析键值序号序列为标准字典")
    except Exception as e:
        raise RuntimeError(f"❌ 解析键值序列失败：{str(e)}")
    
    return parsed_dict, raw_seq

def save_image_info(image_info: List[Dict[str, str]], output_prefix: str = "llama_cpp_images") -> None:
    """
    保存镜像信息为JSON和CSV格式
    :param image_info: 镜像信息列表
    :param output_prefix: 输出文件前缀
    """
    # 1. 保存JSON
    json_path = f"{output_prefix}_info.json"
    try:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(image_info, f, ensure_ascii=False, indent=4)
        print(f"✅ JSON文件已保存：{json_path}")
    except Exception as e:
        print(f"❌ 保存JSON失败：{str(e)}")
    
    # 2. 保存CSV
    csv_path = f"{output_prefix}_info.csv"
    headers = ["镜像序号", "id", "created_at_本地", "updated_at_本地", 'name', 'created_at', 'updated_at', 'short_description', 'pull_count', 'star_count']
    try:
        with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(image_info)
        print(f"✅ CSV文件已保存：{csv_path}")
    except Exception as e:
        print(f"❌ 保存CSV失败：{str(e)}")

def print_console_table(image_info: List[Dict[str, str]]) -> None:
    """
    控制台格式化打印镜像信息
    """
    if not image_info:
        print("❌ 无镜像信息可打印")
        return
    
    # 定义列宽（适配最长字段）
    col_widths = {
        "镜像序号": 8,
        "id": 40,
        "created_at_本地": 20,
        "updated_at_本地": 20
    }
    
    # 打印表头
    print("\n" + "="*90)
    print(f"llama.cpp镜像信息（共{len(image_info)}个）")
    print("="*90)
    header = (f"{'镜像序号':<{col_widths['镜像序号']}}"
              f"{'id':<{col_widths['id']}}"
              f"{'创建时间（本地）':<{col_widths['created_at_本地']}}"
              f"{'更新时间（本地）':<{col_widths['updated_at_本地']}}")
    print(header)
    print("-"*90)
    
    # 打印数据
    for info in image_info:
        row = (f"{info['镜像序号']:<{col_widths['镜像序号']}}"
               f"{info['id']:<{col_widths['id']}}"
               f"{info['created_at_本地']:<{col_widths['created_at_本地']}}"
               f"{info['updated_at_本地']:<{col_widths['updated_at_本地']}}")
        print(row)

if __name__ == "__main__":
    # 配置参数
    parser = argparse.ArgumentParser()
    parser.add_argument("input_path", type=str, help="原始文件的路径")
    args = parser.parse_args()
    INPUT_PATH =  args.input_path # 原始附件路径
    OUTPUT_PREFIX = "images"   # 输出文件前缀
    
    try:
        # 步骤1：加载并解析原始键值序号序列
        parsed_data, raw_seq = load_and_parse_raw_file(INPUT_PATH)
        print(json.dumps(parsed_data))
        # 步骤2：提取镜像目标信息
        image_info = extract_image_info_from_parsed(parsed_data, raw_seq)
        
        # 步骤3：输出结果（控制台+文件）
        print_console_table(image_info)
        save_image_info(image_info, OUTPUT_PREFIX)
        
        print("\n🎉 所有操作完成！")
    
    except Exception as e:
        print(f"\n❌ 程序终止：{str(e)}")
