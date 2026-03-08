import urllib.request
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 获取JS bundle
js_url = 'https://z7niv4gwmf4ok.ok.kimi.link/assets/index-CNou1CLf.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    content = response.read().decode('utf-8')
    with open('kimi_bundle.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('JS bundle saved to kimi_bundle.js')
    print('Content length:', len(content))
