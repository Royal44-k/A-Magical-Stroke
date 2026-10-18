@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "NODE_EXE=%~dp0bin\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
echo 正在打开《神笔马良：奇幻一笔》v5.0。
echo 浏览器地址：http://127.0.0.1:4185/?release=5.0
echo 关闭此窗口即可结束本机课堂服务。
"%NODE_EXE%" --env-file-if-exists=.env launch.mjs
pause
