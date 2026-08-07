/* 守望 AI 演示页：工作流图渲染与交互、场景渲染启动。 */
(function () {
  "use strict";

  /* ---------------- 工作流数据 ---------------- */

  var STAGES = [
    {
      name: "摄像头", where: "家庭现场", chips: [
        { t: "RTSP / ONVIF", s: "stub", d: "首版聚焦标准协议而非厂商私有 SDK；品牌差异隔离在适配层。", c: "edge/camera-adapters/" },
        { t: "USB / UVC", s: "stub", d: "即插即用摄像头，用于开发与部分家庭场景。", c: "edge/camera-adapters/" },
        { t: "手机摄像头(演示)", s: "stub", d: "仅用于前台演示与临时照护；iOS 后台不能承担全天候分析（设计方案 0.2）。", c: "apps/ios" },
        { t: "本地视频文件", s: "stub", d: "离线测试与回归：所有测试视频都要可复现结果。", c: "edge/runtime/tests" }
      ]
    },
    {
      name: "边缘节点", where: "edge/runtime · 家庭内", chips: [
        { t: "CameraAdapter", s: "stub", d: "屏蔽摄像头协议差异，输出标准帧流。", c: "pipeline/camera_adapter.py" },
        { t: "StreamSupervisor", s: "done", d: "连接、重连、心跳；30 秒无帧判定离线（场景④）。", c: "pipeline/stream_supervisor.py" },
        { t: "FrameSampler", s: "done", d: "动态抽帧与分辨率控制，算力预算守门员。", c: "pipeline/frame_sampler.py" },
        { t: "PersonDetector", s: "stub", d: "人体检测（YOLO/ONNX 或 Apple Vision，接口已冻结）。", c: "pipeline/person_detector.py" },
        { t: "AnonymousTracker", s: "stub", d: "匿名轨迹维护：临时编号、不识别身份（隐私设计 7.3）。", c: "pipeline/tracker.py" },
        { t: "PoseEstimator", s: "stub", d: "骨架关键点与躯干角度。", c: "pipeline/pose_estimator.py" },
        { t: "TemporalAnalyzer", s: "stub", d: "时序特征：下降幅度/速度、躯干角度、静止时长。", c: "pipeline/temporal_analyzer.py" },
        { t: "ZoneEngine", s: "done", d: "危险区进入/停留/离开判定（场景②），归一化多边形。", c: "pipeline/zone_engine.py · 8 个测试" },
        { t: "FallCandidateEngine", s: "done", d: "规则候选：急坠 + 躯干水平（场景①/③），单帧不直接报警。", c: "pipeline/fall_candidate.py · 测试覆盖" },
        { t: "RiskVerifier", s: "done", d: "二阶段复核：倒地后静止计时通过才升级（防误报核心）。", c: "pipeline/risk_verifier.py · 测试覆盖" },
        { t: "EvidenceRecorder", s: "stub", d: "本地环形缓存 + 事件前后短片截取，按隐私模式模糊化。", c: "pipeline/evidence_recorder.py" },
        { t: "EventPublisher", s: "done", d: "事件去重、签名、上传：stdout/HTTP 已实现，MQTT 待接。", c: "pipeline/event_publisher.py" },
        { t: "LocalQueue", s: "done", d: "断网期间 SQLite 离线队列，幂等键防重复，重启不丢。", c: "pipeline/local_queue.py · 4 个测试" },
        { t: "ModelManager", s: "stub", d: "模型下载/校验/切换/回滚（模型生命周期 11.3）。", c: "pipeline/model_manager.py" },
        { t: "HealthMonitor", s: "stub", d: "CPU/温度/磁盘/摄像头遥测，设备异常事件来源。", c: "pipeline/health_monitor.py" }
      ]
    },
    {
      name: "云端服务", where: "services/api · 模块化单体", chips: [
        { t: "events", s: "done", d: "事件模块：状态机（4.3）、幂等入库、确认、超时升级。", c: "app/events/ · 9 个测试" },
        { t: "alerts", s: "done", d: "报警编排：L1/L2/L3 → 渠道映射（3.5），订阅领域事件。", c: "app/alerts/ · 4 个测试" },
        { t: "shared_kernel", s: "done", d: "共享词汇 + 进程内领域事件总线：模块间不直接互调（5.1）。", c: "app/shared_kernel/" },
        { t: "identity", s: "stub", d: "登录、令牌刷新（刷新令牌哈希存储）。", c: "app/identity/" },
        { t: "devices", s: "stub", d: "边缘节点注册、一次性配对、在线状态；不存摄像头明文密码。", c: "app/devices/" },
        { t: "zones", s: "stub", d: "危险区域配置与版本（乐观锁），经 commands 主题下发。", c: "app/zones/" },
        { t: "contacts", s: "stub", d: "主/备用联系人与升级顺序，供 alerts 编排。", c: "app/contacts/" },
        { t: "evidence", s: "stub", d: "加密对象存储、短时预签名下载、到期删除（默认 7 天）。", c: "app/evidence/" },
        { t: "consent", s: "stub", d: "授权记录、保存期、上传模式、数据删除请求。", c: "app/consent/" },
        { t: "audit", s: "stub", d: "追加式审计：谁查看/下载/删除了哪个事件。", c: "app/audit/" },
        { t: "model_registry", s: "stub", d: "模型包、版本、哈希、灰度与回滚（11.3）。", c: "app/model_registry/" },
        { t: "telemetry", s: "stub", d: "边缘遥测接入与运行指标（11.6）。", c: "app/telemetry/" }
      ]
    },
    {
      name: "通知服务", where: "services/notification", chips: [
        { t: "通知计划", s: "done", d: "L1 普通推送主联系人；L2 时效推送需确认；L3 全员推送+短信升级。", c: "app/alerts/domain.py · 4 个测试" },
        { t: "APNs 沙盒", s: "done", d: "SandboxApnsSender：开发期记录代替真推送，接口已冻结。", c: "app/alerts/apns.py" },
        { t: "APNs HTTP/2", s: "stub", d: "生产客户端：Token 签名、沙盒/生产双环境、送达回执。", c: "services/notification/" },
        { t: "短信/电话网关", s: "stub", d: "L3 升级通道，供应商可替换；推送失败不影响事件保存（6.2）。", c: "services/notification/" },
        { t: "Critical Alert", s: "stub", d: "可突破静音，但需 Apple 单独批准，不作为 MVP 能力。", c: "设计方案 3.5" }
      ]
    },
    {
      name: "iOS 监护人 App", where: "apps/ios · Swift 6", chips: [
        { t: "EventCenter", s: "done", d: "参考模块全五层：事件列表、详情、确认/误报，Mock 可预览。", c: "apps/ios/.../Features/EventCenter/" },
        { t: "AlertHandling", s: "stub", d: "推送解析、报警确认、处置记录。", c: "apps/ios（待建）" },
        { t: "ZoneEditor", s: "stub", d: "在画面上绘制危险区（归一化坐标，版本化）。", c: "apps/ios（待建）" },
        { t: "DeviceSetup", s: "stub", d: "扫码配对边缘节点、发现摄像头、连通性测试。", c: "apps/ios（待建）" },
        { t: "LiveView", s: "stub", d: "实时状态、快照、授权后的 HLS 直播（边缘转码）。", c: "apps/ios（待建）" },
        { t: "PrivacyConsent", s: "stub", d: "授权、保存期、上传模式、数据删除。", c: "apps/ios（待建）" },
        { t: "Security", s: "stub", d: "Keychain、CryptoKit、App Attest；刷新令牌不出安全区。", c: "apps/ios（待建）" }
      ]
    }
  ];

  /* ---------------- 渲染 ---------------- */

  function renderFlow() {
    var host = document.getElementById("flow");
    if (!host) return;
    host.innerHTML = STAGES.map(function (stage, si) {
      var chips = stage.chips.map(function (chip, ci) {
        return '<span class="chip ' + chip.s + '" data-s="' + si + '" data-c="' + ci + '">' + chip.t + "</span>";
      }).join("");
      return '<div class="stage"><h4>' + stage.name + '</h4><div class="where">' +
        stage.where + '</div><div class="chips">' + chips + "</div></div>";
    }).join("");
  }

  function wireDetailPanel() {
    var panel = document.getElementById("stage-detail");
    var flow = document.getElementById("flow");
    if (!panel || !flow) return;
    function show(si, ci) {
      var chip = STAGES[si].chips[ci];
      var status = chip.s === "done" ? "已有真实逻辑 + 测试" : "接口已冻结 · 实现待填充";
      panel.innerHTML =
        "<h5>" + STAGES[si].name + " · " + chip.t +
        ' <span style="font-size:11px;color:' + (chip.s === "done" ? "#7FCB9C" : "#C9C2B8") +
        '">' + status + "</span></h5><p>" + chip.d + '</p><span class="code">' + chip.c + "</span>";
    }
    flow.addEventListener("mouseover", function (e) {
      var el = e.target.closest(".chip");
      if (el) show(+el.dataset.s, +el.dataset.c);
    });
    flow.addEventListener("click", function (e) {
      var el = e.target.closest(".chip");
      if (el) show(+el.dataset.s, +el.dataset.c);
    });
  }

  renderFlow();
  wireDetailPanel();
  if (window.WatchCareScenes) window.WatchCareScenes.renderAll();
  if (window.WatchCarePhones) window.WatchCarePhones.renderAll();
})();
