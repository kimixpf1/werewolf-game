import re
import json

with open('kimi_bundle.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取 speechesDetail 对象
# 格式: "2026-01":{abstract:"...",fullText:`...`,analysis:`...`}
# 我们需要逐个提取每个条目

results = {}

# 查找所有类似 "20XX-XX":{...} 的模式
# 使用更精确的方法：找到 speechesDetail 对象的开始和结束

# 首先找到 speechesDetail 的位置
idx = content.find('speechesDetail')
if idx == -1:
    # 尝试另一种模式
    idx = content.find('"2026-01":{abstract')
    
if idx != -1:
    print(f'Found speechesDetail context at position {idx}')
    
    # 从这个位置向前搜索找到对象开始
    # 向后搜索找到对象结束
    
    # 更简单的方法：提取所有已知的ID
    ids = [
        '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
        '2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
        '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
        '2025-11', '2025-12', '2025-13', '2025-14', '2025-15',
        '2025-16', '2025-17', '2025-18',
        '2024-01', '2024-02', '2024-03', '2024-04', '2024-05',
        '2024-06', '2024-07', '2024-08', '2024-09', '2024-10',
        '2024-11', '2024-12', '2024-13', '2024-14', '2024-15',
        '2024-16', '2024-20', '2024-21', '2024-22', '2024-23'
    ]
    
    for id_val in ids:
        pattern = f'"{id_val}":' + r'\{abstract:"[^"]*"[^}]*fullText:`[^`]*`[^}]*analysis:`[^`]*`[^}]*\}'
        # 更灵活的模式
        pattern = f'"{id_val}":' + r'\{[^}]*abstract:[^,]*,[^}]*fullText:[^,]*,[^}]*analysis:[^}]*\}'
        
        # 找到这个ID的位置
        id_pattern = f'"{id_val}":{{'
        id_idx = content.find(id_pattern)
        if id_idx == -1:
            continue
            
        # 从这个位置开始，找到匹配的 }
        start_idx = id_idx + len(id_pattern) - 1  # 指向 {
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
        
        # 解析这个对象
        # 提取 abstract, fullText, analysis
        def extract_field(obj, field_name):
            # 查找 field_name:"..." 或 fieldName:`...`
            patterns = [
                f'{field_name}:"([^"]*)"',
                f"{field_name}:'([^']*)'",
                f'{field_name}:`([^`]*)`',
            ]
            for p in patterns:
                match = re.search(p, obj, re.DOTALL)
                if match:
                    return match.group(1)
            return None
        
        abstract = extract_field(obj_str, 'abstract')
        fullText = extract_field(obj_str, 'fullText')
        analysis = extract_field(obj_str, 'analysis')
        
        if abstract or fullText or analysis:
            results[id_val] = {
                'abstract': abstract,
                'fullText': fullText,
                'analysis': analysis
            }
            print(f'Extracted {id_val}: abstract={abstract is not None}, fullText={fullText is not None}, analysis={analysis is not None}')

print(f'\nTotal extracted: {len(results)} entries')

# 保存结果
with open('kimi_speeches_detail.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print('Saved to kimi_speeches_detail.json')
