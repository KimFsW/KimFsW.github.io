# camera-adapters（占位）

屏蔽不同摄像头协议差异（设计方案 4.1 CameraAdapter / 6.2 适配器规则）。

计划支持：RTSP（FFmpeg/OpenCV）、ONVIF 发现、USB/UVC、本地视频文件测试模式。
摄像头凭据只保存在边缘节点的加密存储，绝不上传云端（设计方案 7.1）。
