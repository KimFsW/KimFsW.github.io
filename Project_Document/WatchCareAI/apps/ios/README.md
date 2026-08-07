# iOS 监护人 App（守望 AI）

对应设计方案第 3 节。技术栈：Swift 6 + SwiftUI + Swift Concurrency，
最低 iOS 18，用 iOS 26 SDK 构建。

## 架构约定

Clean Architecture + MVVM，依赖方向固定：

```
Presentation -> Application -> Domain
Data(基础设施) 实现 Domain 声明的协议
```

Domain 层不得 import SwiftUI / UIKit / 网络框架（设计方案 1.2、6.3）。
每个功能模块按统一模板组织：

```
Feature/
├── Presentation/   # View + ViewModel(@Observable)
├── Application/    # UseCase（一个用例一个类型）
├── Domain/         # 实体 + 协议（Repository 端口）
├── Data/           # API / SwiftData / Mock 实现
└── Tests/
```

## 当前进度

- `WatchCareAI/AppShell/` — 入口与依赖注入容器；
- `WatchCareAI/Features/EventCenter/` — **参考实现**：事件中心模块全五层，
  作为其他模块的复制模板；`Data/MockEventRepository.swift` 可在没有
  云端时直接预览 UI。

## 待建模块（设计方案 3.1 职责表）

| 模块 | 职责 | 不承担 |
|---|---|---|
| Identity | 登录、令牌刷新（Keychain）、设备绑定 | 事件逻辑 |
| CareSubject | 被照护对象档案与风险配置 | 视频分析 |
| DeviceSetup | 扫码配对边缘节点、发现摄像头、连通性测试 | 持续视频解码 |
| LiveView | 实时状态、快照、授权后 HLS 直播 | 控制 AI 规则 |
| ZoneEditor | 绘制床区/危险区/忽略区（归一化坐标） | 事件判定 |
| AlertHandling | 推送解析、报警确认、误报与处置记录 | APNs 服务端 |
| ContactPlan | 主/备用联系人与升级顺序 | 短信电话网关 |
| PrivacyConsent | 授权、保存期、上传模式、数据删除 | 法律判断 |
| Diagnostics | 网络、权限、推送、设备诊断 | 修改业务数据 |
| LocalPersistence | SwiftData 缓存与离线队列 | 页面逻辑 |
| Networking | URLSession、WebSocket（失败退化为轮询） | 业务状态决策 |
| Security | Keychain、CryptoKit、App Attest | 业务模型 |

## 关键平台约束（设计方案 0.2）

iOS App 是监护终端，不是全天候分析服务器：不做后台 RTSP 分析；
即使 App 被系统终止，云端仍可通过 APNs 送达报警。
