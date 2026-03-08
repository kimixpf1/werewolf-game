import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://z7niv4gwmf4ok.ok.kimi.link'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    content = response.read().decode('utf-8')
    with open('kimi_page.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Page saved to kimi_page.html')
    print('Content length:', len(content))
    print('\n--- First 5000 chars ---\n')
    print(content[:5000])
