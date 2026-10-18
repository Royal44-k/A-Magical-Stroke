import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
fs.writeFileSync(new URL('../public/version.json',import.meta.url),JSON.stringify({project:'maliang-qihuan',version:p.version,built:new Date().toISOString().slice(0,10)})+'\n');
