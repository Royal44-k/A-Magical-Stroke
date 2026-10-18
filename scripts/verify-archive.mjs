import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'catalog/asset-manifest.json'),'utf8'));
let bytes=0;for(const f of m.files){const p=path.resolve(root,f.path);assert.ok(p.startsWith(root+path.sep),'Path leaves repository: '+f.path);assert.ok(fs.existsSync(p),'Missing: '+f.path);const b=fs.readFileSync(p);assert.equal(b.length,f.bytes,'Size: '+f.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256,'SHA256: '+f.path);bytes+=b.length;}
console.log(JSON.stringify({status:'passed',files:m.files.length,bytes,hash:'SHA-256'},null,2));
