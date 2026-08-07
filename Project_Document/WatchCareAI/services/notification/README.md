# notification（占位）

通知服务（设计方案 0.1 / 3.5）。计划职责：

- APNs 生产客户端：HTTP/2、Token 签名、沙盒/生产双环境、送达回执；
- 短信与电话网关适配（L3 升级通道，供应商可替换）；
- 通知失败重试与降级：推送失败不影响事件保存（设计方案 6.2 规则 9）；
- 本服务的接口形态已由 `services/api/app/alerts/apns.py` 的 `ApnsSender` 协议冻结。
