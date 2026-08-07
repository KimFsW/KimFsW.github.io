# Features/EventCenter 事件中心（参考模块）

风险事件列表、详情、筛选与处置。按统一模板组织五层（设计方案 3.1）：

| 层 | 文件 | 作用 |
|---|---|---|
| Domain | `Domain/RiskEvent.swift` | 事件实体：与 `contracts/` 信封对齐 + 生命周期状态枚举 |
| Domain | `Domain/EventRepository.swift` | 仓储协议（依赖倒置，设计方案 6.3 示例） |
| Domain | `Domain/AcknowledgementAction.swift` | 监护人四种处置动作 |
| Application | `Application/FetchEventsUseCase.swift` | 用例：分页拉取事件 |
| Application | `Application/AcknowledgeEventUseCase.swift` | 用例：确认/误报，驱动云端状态机 |
| Presentation | `Presentation/EventListViewModel.swift` | `@Observable` 视图模型：加载状态 + 事件列表 |
| Presentation | `Presentation/EventListView.swift` | SwiftUI 列表：等级徽章、状态、原因文本、处置按钮 |
| Data | `Data/APIEventRepository.swift` | URLSession 实现（REST，设计方案 5.2） |
| Data | `Data/MockEventRepository.swift` | Mock 实现：无云端时预览整个 UI |

领域层不 import SwiftUI/网络框架；替换实现只需换 Data 层。
