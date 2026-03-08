import re
import json

with open('kimi_bundle.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 speechesDetail 对象
# 格式类似: "2026-01":{abstract:"...",fullText:`...`,analysis:`...`}
# 我们需要找到整个 speechesDetail 对象

# 方法1：查找 speechesDetail 变量定义
pattern1 = r'speechesDetail\s*=\s*\{([^}]+\})'
# 方法2：查找包含大量 "abstract" 和 "fullText" 的对象

# 先尝试找到 speechesDetail 的位置
idx = content.find('speechesDetail')
if idx != -1:
    print(f'Found speechesDetail at position {idx}')
    
    # 从这个位置开始，找到完整的对象定义
    # speechesDetail 可能定义为 const speechesDetail = {...}
    start_idx = idx
    # 向前找到 = 或 { 的位置
    while start_idx > 0 and content[start_idx] != '{':
        start_idx += 1
        if content[start_idx] == '=':
            start_idx += 1
            # 跳过空格
            while start_idx < len(content) and content[start_idx] in ' \n\t':
                start_idx += 1
            break
    
    # 现在从 start_idx 开始找到匹配的 }
    brace_count = 0
    end_idx = start_idx
    in_string = False
    in_template = False
    escape_next = False
    string_char = None
    
    while end_idx < len(content):
        char = content[end_idx]
        
        if escape_next:
            escape_next = False
            end_idx += 1
            continue
            
        if char == '\\':
            escape_next = True
            end_idx += 1
            continue
            
        if in_template:
            if char == '`':
                in_template = False
            end_idx += 1
            continue
            
        if in_string:
            if char == string_char:
                in_string = False
            end_idx += 1
            continue
            
        if char in '"\'':
            in_string = True
            string_char = char
            end_idx += 1
            continue
            
        if char == '`':
            in_template = True
            end_idx += 1
            continue
            
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                break
                
        end_idx += 1
    
    obj_str = content[start_idx:end_idx+1]
    print(f'Object length: {len(obj_str)}')
    
    # 保存原始对象字符串
    with open('speechesDetail_raw.txt', 'w', encoding='utf-8') as f:
        f.write(obj_str)
    print('Saved raw object to speechesDetail_raw.txt')
    
    # 尝试解析为JSON（需要转换JS语法）
    # 将模板字符串 `...` 转换为 "..."
    # 将单引号字符串 '...' 转换为 "..."
    
else:
    print('speechesDetail not found')
    
    # 尝试另一种方法：查找包含 "abstract" 和 "fullText" 的模式
    # 查找类似 "2026-01":{abstract:"...",fullText:`...`,analysis:`...`}
    pattern = r'"20\d{2}-\d{2}":\{abstract:"[^"]*"[^}]*\}'
    matches = re.findall(pattern, content)
    print(f'Found {len(matches)} potential speech detail entries')
    if matches:
        print('First match:', matches[0][:200])
