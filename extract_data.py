import re
import json

with open('kimi_bundle.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 speechesData 数组
# 模式：speechesData=[...] 或 const speechesData=[...]
patterns = [
    r'speechesData\s*=\s*(\[[\s\S]*?\]\s*[,;])',
    r'const\s+speechesData\s*=\s*(\[[\s\S]*?\]\s*[,;])',
    r'export\s+const\s+speechesData\s*=\s*(\[[\s\S]*?\]\s*[,;])',
]

found = False
for pattern in patterns:
    matches = re.findall(pattern, content)
    if matches:
        print(f'Found {len(matches)} matches with pattern: {pattern[:30]}...')
        for i, match in enumerate(matches):
            # 尝试解析JSON
            try:
                # 清理JS语法，转为JSON
                json_str = match.rstrip(',;')
                data = json.loads(json_str)
                print(f'\nMatch {i+1}: Found {len(data)} speeches')
                with open('kimi_speeches.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print('Data saved to kimi_speeches.json')
                found = True
                break
            except json.JSONDecodeError as e:
                print(f'Match {i+1}: JSON parse error - {e}')
                continue
        if found:
            break

if not found:
    # 尝试另一种方法：查找包含 "id": "2026-01" 等特征的对象
    print('Trying alternative method...')
    # 查找包含 speechesData 的位置
    idx = content.find('speechesData')
    if idx != -1:
        print(f'Found speechesData at position {idx}')
        # 打印周围的内容
        start = max(0, idx - 100)
        end = min(len(content), idx + 500)
        print(f'Context: {content[start:end]}')
