import {server} from './server.mjs';
import fs from 'node:fs';
const version=JSON.parse(fs.readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
import {execFile} from 'node:child_process';
const port=Number(process.env.PORT||4185),url='http://127.0.0.1:'+port+'/?release='+version.replace(/\.0$/,'');
const open=()=>{console.log('课堂画卷：'+url);if(process.platform==='win32')execFile('cmd.exe',['/c','start','',url],{windowsHide:true},()=>{});};
server.once('error',async e=>{if(e.code==='EADDRINUSE'){try{const r=await fetch('http://127.0.0.1:'+port+'/version.json',{signal:AbortSignal.timeout(1500)}),v=await r.json();if(v.project==='maliang-qihuan'&&v.version===version){open();return}}catch{}console.error('这个端口正在使用。请关闭原来的课堂服务，或在.env中设置PORT后再打开。');}else console.error('启动未完成：'+e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',open);
