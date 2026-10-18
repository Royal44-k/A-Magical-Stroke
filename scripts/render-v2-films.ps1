param([string]$Ffmpeg='ffmpeg',[string]$HyperframesVersion='0.8.156')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
# 先在film-v2内安装制作依赖；学生运行不需要它们。
npx --yes "hyperframes@$HyperframesVersion" check film-v2
if($LASTEXITCODE -ne 0){throw '视频检查未通过'}
npx --yes "hyperframes@$HyperframesVersion" render film-v2 --output renders/scene-pair.mp4 --fps 24 --quality high --workers 1 --low-memory-mode
if($LASTEXITCODE -ne 0){throw '视频渲染未完成'}
& $Ffmpeg -y -v error -i renders/scene-pair.mp4 -i film-v2/assets/night-voice.wav -filter_complex '[1:a]adelay=600|600,apad,atrim=0:8,afade=t=out:st=7.5:d=0.5[a]' -map 0:v -map '[a]' -t 8 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/video/v2-night.mp4
if($LASTEXITCODE -ne 0){throw '雨夜片段配音失败'}
& $Ffmpeg -y -v error -ss 8 -i renders/scene-pair.mp4 -i film-v2/assets/river-voice.wav -filter_complex '[1:a]adelay=350|350,apad,atrim=0:8,afade=t=out:st=7.5:d=0.5[a]' -map 0:v -map '[a]' -t 8 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/video/v2-river.mp4
if($LASTEXITCODE -ne 0){throw '河边片段配音失败'}
