const https = require('https');
const fs = require('fs');

https.get('https://z7niv4gwmf4ok.ok.kimi.link', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('kimi_page.html', data, 'utf8');
    console.log('Page saved to kimi_page.html');
    console.log('Content length:', data.length);
    console.log('\n--- First 5000 chars ---\n');
    console.log(data.substring(0, 5000));
  });
}).on('error', e => console.error('Error:', e));
