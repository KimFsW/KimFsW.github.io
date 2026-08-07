# WatchCareAI/ iOS 源码根

本目录内容加入 Xcode 工程 target 即可构建（最低 iOS 18，iOS 26 SDK）。

| 文件/目录 | 作用 |
|---|---|
| `WatchCareAIApp.swift` | `@main` 入口：装配 DI 容器与根视图；预留 APNs 注册位置 |
| `AppShell/AppDIContainer.swift` | 组合根（设计方案 3.1 AppShell）：持有长寿命依赖，在 API 实现与 Mock 实现之间切换 |
| `Features/EventCenter/` | 参考特性模块（全五层），其他 12 个模块照此模板复制 |
