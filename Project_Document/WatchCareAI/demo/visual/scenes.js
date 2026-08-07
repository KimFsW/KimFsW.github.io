/* 守望 AI 演示：四个虚拟监控场景（SVG 场景层 + AI 标注层）。
 *
 * 标注坐标与场景绘制使用同一坐标系（viewBox 0 0 160 90），
 * 区域多边形直接采用设计方案 3.3 节的归一化坐标换算（x*160, y*90）。
 * 本文件只产出字符串，不依赖 DOM，可在 Node 中直接测试。
 */
(function (global) {
  "use strict";

  var MONO = "JetBrains Mono,Consolas,monospace";

  /* ---------------- 共用绘制助手 ---------------- */

  function roomBase() {
    return (
      '<rect x="0" y="0" width="160" height="54" fill="#E9E3DA"/>' +
      '<polygon points="0,54 160,54 160,90 0,90" fill="#D9D0C3"/>' +
      '<g stroke="rgba(26,21,18,.07)" stroke-width=".4">' +
      '<line x1="80" y1="54" x2="8" y2="90"/><line x1="80" y1="54" x2="48" y2="90"/>' +
      '<line x1="80" y1="54" x2="80" y2="90"/><line x1="80" y1="54" x2="112" y2="90"/>' +
      '<line x1="80" y1="54" x2="152" y2="90"/>' +
      '<line x1="0" y1="66" x2="160" y2="66"/><line x1="0" y1="78" x2="160" y2="78"/></g>' +
      '<rect x="0" y="52.6" width="160" height="1.8" fill="#CFC6B8"/>'
    );
  }

  function vignette(sid) {
    return (
      '<defs><radialGradient id="vig-' + sid + '" cx="50%" cy="42%" r="75%">' +
      '<stop offset="55%" stop-color="rgba(0,0,0,0)"/>' +
      '<stop offset="100%" stop-color="rgba(10,8,6,.32)"/></radialGradient></defs>' +
      '<rect x="0" y="0" width="160" height="90" fill="url(#vig-' + sid + ')"/>'
    );
  }

  function cornerBrackets(color) {
    return (
      '<g stroke="' + color + '" stroke-width=".8" fill="none">' +
      '<path d="M2 6 V2 H6"/><path d="M154 2 H158 V6"/>' +
      '<path d="M2 84 V88 H6"/><path d="M154 88 H158 V84"/></g>'
    );
  }

  function hud(cam, time, opts) {
    opts = opts || {};
    var color = opts.color || "#E8E8E8";
    var rec = opts.rec === false ? "" :
      '<circle cx="146" cy="4.5" r="1.7" fill="#E5484D"/>' +
      '<text x="150" y="6.4" font-family="' + MONO + '" font-size="4" fill="#E8E8E8">REC</text>';
    return (
      '<rect x="0" y="0" width="160" height="9" fill="rgba(10,10,12,.55)"/>' +
      '<text x="4" y="6.4" font-family="' + MONO + '" font-size="4" fill="' + color + '">' + cam + '</text>' +
      rec +
      '<text x="156" y="86.8" text-anchor="end" font-family="' + MONO + '" font-size="3.8" fill="rgba(255,255,255,.8)">' + time + '</text>' +
      cornerBrackets(opts.bracket || "rgba(255,255,255,.35)")
    );
  }

  function callout(x, y, w, lines, accent) {
    var h = 5 + lines.length * 5.2;
    var texts = lines.map(function (t, i) {
      return '<text x="' + (x + 3) + '" y="' + (y + 6.4 + i * 5.2) +
        '" font-family="' + MONO + '" font-size="3.5" fill="#EDE9E2">' + t + '</text>';
    }).join("");
    return (
      '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="1.5" fill="rgba(12,12,14,.74)"/>' +
      '<rect x="' + x + '" y="' + y + '" width="1.3" height="' + h + '" fill="' + accent + '"/>' +
      texts + '</g>'
    );
  }

  function bboxTag(x, y, w, color, label) {
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="6" fill="' + color + '"/>' +
      '<text x="' + (x + 2.5) + '" y="' + (y + 4.4) + '" font-family="' + MONO +
      '" font-size="3.8" fill="#fff">' + label + '</text>'
    );
  }

  /* ---------------- 场景 1：老人跌倒（L3） ---------------- */

  function sceneFall() {
    return (
      '<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="老人跌倒监控画面示意">' +
      roomBase() +
      /* 窗户与午后光线 */
      '<g><rect x="122" y="10" width="26" height="30" fill="#BFD4DE" stroke="#9FB3BD" stroke-width="1"/>' +
      '<line x1="135" y1="10" x2="135" y2="40" stroke="#9FB3BD" stroke-width=".7"/>' +
      '<line x1="122" y1="25" x2="148" y2="25" stroke="#9FB3BD" stroke-width=".7"/></g>' +
      '<polygon points="122,40 148,40 156,80 110,80" fill="rgba(255,240,200,.16)"/>' +
      /* 沙发 */
      '<g><rect x="8" y="34" width="9" height="28" rx="3" fill="#7A5C46"/>' +
      '<rect x="8" y="46" width="42" height="16" rx="3" fill="#8C6F56"/>' +
      '<rect x="8" y="60" width="42" height="4" rx="2" fill="#6E5644"/>' +
      '<line x1="22" y1="46" x2="22" y2="60" stroke="rgba(0,0,0,.15)" stroke-width=".7"/>' +
      '<line x1="36" y1="46" x2="36" y2="60" stroke="rgba(0,0,0,.15)" stroke-width=".7"/></g>' +
      /* 地毯 */
      '<ellipse cx="92" cy="75" rx="42" ry="10" fill="#B9A58E"/>' +
      '<ellipse cx="92" cy="75" rx="34" ry="7.5" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".7"/>' +
      /* 跌倒前的站立残影 */
      '<g opacity=".32" stroke="#5E5A54" stroke-width=".7" stroke-dasharray="2 1.6" fill="rgba(94,90,84,.25)">' +
      '<circle cx="63" cy="34" r="4.5"/><rect x="58.5" y="38" width="9" height="23" rx="4"/></g>' +
      /* 倒地的人（躯干接近水平） */
      '<g><rect x="60" y="64" width="52" height="10" rx="5" fill="#5E7A8A"/>' +
      '<rect x="100" y="66.5" width="14" height="4" rx="2" fill="#4A6170"/>' +
      '<circle cx="56" cy="68.5" r="5" fill="#D9B08C"/>' +
      '<rect x="66" y="72.5" width="18" height="3.4" rx="1.7" fill="#D9B08C"/></g>' +
      vignette("fall") +
      hud("CAM-01 · 客厅", "2026-08-05 14:32:07") +
      /* ===== AI 标注层 ===== */
      '<defs><marker id="arr-fall" markerWidth="6" markerHeight="6" refX="5" refY="2.4" orient="auto">' +
      '<path d="M0,0 L5,2.4 L0,4.8 Z" fill="#E5484D"/></marker></defs>' +
      '<path d="M63 40 C 66 48, 62 56, 58 62" fill="none" stroke="#E5484D" stroke-width="1" stroke-dasharray="2.4 2" marker-end="url(#arr-fall)"/>' +
      '<rect x="49" y="58" width="69" height="23" rx="1" fill="none" stroke="#E5484D" stroke-width=".9" stroke-dasharray="3.2 2.2"/>' +
      bboxTag(49, 51.8, 30, "#E5484D", "track_07 · 0.96") +
      '<polyline points="56,68.5 70,69 86,69 100,68 110,68.5" fill="none" stroke="#FFD166" stroke-width="1"/>' +
      '<g fill="#FFD166"><circle cx="56" cy="68.5" r="1.2"/><circle cx="70" cy="69" r="1.2"/>' +
      '<circle cx="86" cy="69" r="1.2"/><circle cx="100" cy="68" r="1.2"/><circle cx="110" cy="68.5" r="1.2"/></g>' +
      '<text x="72" y="63.4" font-family="' + MONO + '" font-size="3.8" fill="#FFD166">躯干角度 78°</text>' +
      callout(6, 12, 62, ["RAPID_VERTICAL_DROP  52%/420ms", "NO_RECOVERY  25s"], "#E5484D") +
      '</svg>'
    );
  }

  /* ---------------- 场景 2：儿童进入阳台危险区（L2） ---------------- */

  function sceneZone() {
    return (
      '<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="儿童进入危险区域监控画面示意">' +
      roomBase() +
      /* 阳台推拉门与护栏 */
      '<g><rect x="112" y="8" width="40" height="64" fill="#7A8894"/>' +
      '<rect x="115" y="11" width="34" height="58" fill="#BFD4DE" opacity=".85"/>' +
      '<g stroke="#7A8894" stroke-width=".9"><line x1="115" y1="26" x2="149" y2="26"/>' +
      '<line x1="115" y1="40" x2="149" y2="40"/><line x1="115" y1="54" x2="149" y2="54"/></g>' +
      '<line x1="132" y1="8" x2="132" y2="72" stroke="#5E6B76" stroke-width="1.2"/>' +
      '<rect x="128" y="38" width="2.4" height="7" rx="1" fill="#4A5560"/></g>' +
      /* 茶几与绿植 */
      '<g><rect x="48" y="60" width="20" height="3" rx="1" fill="#7A5C46"/>' +
      '<rect x="51" y="63" width="2.4" height="10" fill="#6E5644"/>' +
      '<rect x="62" y="63" width="2.4" height="10" fill="#6E5644"/></g>' +
      '<g><rect x="24" y="64" width="10" height="8" rx="1" fill="#8C6F56"/>' +
      '<circle cx="29" cy="58" r="6" fill="#5F8A5E"/><circle cx="25" cy="61" r="4" fill="#6E9A6C"/>' +
      '<circle cx="33" cy="61" r="4" fill="#6E9A6C"/></g>' +
      /* 儿童（脚部特征点在多边形内） */
      '<g><circle cx="124" cy="53.5" r="4" fill="#E3B78F"/>' +
      '<rect x="120.5" y="57.5" width="7" height="14" rx="3" fill="#C48B4A"/>' +
      '<rect x="121.5" y="71" width="2" height="5.5" fill="#7A8894"/>' +
      '<rect x="125" y="71" width="2" height="5.5" fill="#7A8894"/></g>' +
      vignette("zone") +
      hud("CAM-02 · 客厅", "2026-08-05 17:08:42") +
      /* ===== AI 标注层 ===== */
      /* 危险区域多边形：设计方案 3.3 示例坐标 (0.52,0.20)(0.91,0.20)(0.93,0.88)(0.50,0.87) */
      '<polygon points="83.2,18 145.6,18 148.8,79.2 80,78.3" fill="rgba(217,147,13,.13)" stroke="#D9930D" stroke-width=".9" stroke-dasharray="3.2 2.2"/>' +
      '<rect x="104" y="11.5" width="40" height="6" fill="#D9930D"/>' +
      '<text x="106.5" y="15.9" font-family="' + MONO + '" font-size="3.8" fill="#1A1512">DANGER zone_01 阳台</text>' +
      '<rect x="118" y="48.5" width="13" height="28.5" fill="none" stroke="#D9930D" stroke-width=".9" stroke-dasharray="3.2 2.2"/>' +
      bboxTag(118, 42.3, 20, "#D9930D", "track_03") +
      '<circle cx="124" cy="77" r="1.6" fill="#FFD166" stroke="#1A1512" stroke-width=".4"/>' +
      callout(6, 12, 78, ["ENTER 14:32:07   track_03 → zone_01", "脚部特征点 bottom_center ∈ 多边形", "停留 1.2s ≥ 阈值 1.0s → STAY (L2)"], "#D9930D") +
      '</svg>'
    );
  }

  /* ---------------- 场景 3：快速坐下（不报警） ---------------- */

  function sceneSafe() {
    return (
      '<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="正常坐下不报警监控画面示意">' +
      roomBase() +
      /* 书架 */
      '<g><rect x="8" y="12" width="30" height="40" fill="#8C6F56"/>' +
      '<g fill="#B9A58E"><rect x="11" y="16" width="24" height="3"/><rect x="11" y="23" width="24" height="3"/>' +
      '<rect x="11" y="30" width="24" height="3"/><rect x="11" y="37" width="24" height="3"/></g></g>' +
      /* 沙发（老人正坐下） */
      '<g><rect x="106" y="40" width="10" height="28" rx="3" fill="#7A5C46"/>' +
      '<rect x="72" y="52" width="44" height="15" rx="3" fill="#8C6F56"/>' +
      '<rect x="72" y="65" width="44" height="4" rx="2" fill="#6E5644"/></g>' +
      /* 站立残影（1.5 秒前） */
      '<g opacity=".3" stroke="#5E5A54" stroke-width=".7" stroke-dasharray="2 1.6" fill="rgba(94,90,84,.25)">' +
      '<circle cx="78" cy="32" r="4.5"/><rect x="74" y="36" width="9" height="24" rx="4"/></g>' +
      /* 坐着的老人（躯干直立） */
      '<g><rect x="86" y="40" width="9" height="17" rx="4" fill="#5E7A8A"/>' +
      '<circle cx="90.5" cy="34.5" r="4.5" fill="#D9B08C"/>' +
      '<rect x="88" y="55" width="12" height="4" rx="2" fill="#4A6170"/>' +
      '<rect x="97" y="57" width="4" height="11" rx="2" fill="#4A6170"/></g>' +
      vignette("safe") +
      hud("CAM-01 · 客厅", "2026-08-05 15:20:18") +
      /* ===== AI 标注层 ===== */
      '<defs><marker id="arr-safe" markerWidth="6" markerHeight="6" refX="5" refY="2.4" orient="auto">' +
      '<path d="M0,0 L5,2.4 L0,4.8 Z" fill="#3E9B6B"/></marker></defs>' +
      '<path d="M79 36 C 82 40, 84 42, 86 44" fill="none" stroke="#3E9B6B" stroke-width="1" stroke-dasharray="2.4 2" marker-end="url(#arr-safe)"/>' +
      '<rect x="82" y="28" width="24" height="45" rx="1" fill="none" stroke="#3E9B6B" stroke-width=".9" stroke-dasharray="3.2 2.2"/>' +
      bboxTag(82, 21.8, 20, "#3E9B6B", "track_07") +
      '<text x="110" y="34" font-family="' + MONO + '" font-size="3.8" fill="#3E9B6B">躯干 15°</text>' +
      /* 安全徽章 */
      '<circle cx="140" cy="18" r="8.5" fill="#3E9B6B"/>' +
      '<path d="M135.8 18 l3 3 l6 -6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' +
      '<text x="122" y="31" font-family="' + MONO + '" font-size="4" fill="#3E9B6B">未生成候选 · 不报警</text>' +
      callout(6, 60, 76, ["下降 20% / 1500ms（受控坐下）", "躯干 15° 保持直立", "→ 不满足 RAPID_VERTICAL_DROP，无候选"], "#3E9B6B") +
      '</svg>'
    );
  }

  /* ---------------- 场景 4：摄像头离线（L1） ---------------- */

  function noiseDots() {
    /* 确定性伪随机噪点（LCG），避免每次刷新画面跳动 */
    var out = "", seed = 42;
    for (var i = 0; i < 34; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var x = (seed % 16000) / 100;
      seed = (seed * 1103515245 + 12345) % 2147483648;
      var y = (seed % 9000) / 100;
      var o = 0.04 + (seed % 8) / 100;
      out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="rgba(255,255,255,' + o.toFixed(2) + ')"/>';
    }
    return out;
  }

  function sceneOffline() {
    var ticks = "";
    for (var x = 14; x <= 86; x += 6) {
      ticks += '<line x1="' + x + '" y1="77" x2="' + x + '" y2="83" stroke="#5E8A5E" stroke-width="1.4"/>';
    }
    return (
      '<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="摄像头离线画面示意">' +
      '<rect x="0" y="0" width="160" height="90" fill="#101216"/>' +
      '<g stroke="rgba(255,255,255,.05)" stroke-width=".5">' +
      '<line x1="0" y1="54" x2="160" y2="54"/><line x1="80" y1="54" x2="20" y2="90"/>' +
      '<line x1="80" y1="54" x2="140" y2="90"/></g>' +
      /* 被布盖住的镜头 */
      '<ellipse cx="80" cy="42" rx="36" ry="24" fill="#07080A"/>' +
      '<path d="M52 34 Q 80 22 108 34" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1.4"/>' +
      noiseDots() +
      '<style>.blk{animation:blk 1.1s steps(2) infinite}@keyframes blk{50%{opacity:.15}}</style>' +
      '<text class="blk" x="80" y="24" text-anchor="middle" font-family="' + MONO + '" font-size="5.5" font-weight="700" fill="#D9930D">信号丢失 SIGNAL LOST</text>' +
      vignette("off") +
      hud("CAM-02 · 卧室", "2026-08-05 02:14:55", { rec: false, color: "#D9930D", bracket: "rgba(217,147,13,.6)" }) +
      /* ===== AI 标注层：心跳时间线 ===== */
      callout(12, 58, 92, ["StreamSupervisor：32s 无新帧 > 30s 阈值", "→ CAMERA_OFFLINE（L1），本地持续重连"], "#D9930D") +
      '<line x1="12" y1="80" x2="150" y2="80" stroke="#5E5A54" stroke-width=".7"/>' +
      ticks +
      '<g stroke="#E5484D" stroke-width="1.4"><line x1="90" y1="76" x2="96" y2="84"/><line x1="96" y1="76" x2="90" y2="84"/></g>' +
      '<text x="100" y="76.5" font-family="' + MONO + '" font-size="3.6" fill="#D9930D">14:32:07 起无新帧</text>' +
      '</svg>'
    );
  }

  /* ---------------- 场景叙事数据 ---------------- */

  var SCENARIOS = [
    {
      id: "scene-fall",
      title: "场景① 老人跌倒后长时间未起身",
      badge: { cls: "l3", text: "L3 紧急" },
      meta: "客厅 CAM-01 · 白天 · 独居老人 · 核心 P0 场景",
      svg: sceneFall,
      steps: [
        { cls: "", html: "<b>FrameSampler</b> 以 10fps 抽帧，控制边缘节点算力消耗" },
        { cls: "", html: "<b>PersonDetector</b> 检出人体 <span class='mono'>bbox conf 0.96</span>" },
        { cls: "", html: "<b>AnonymousTracker</b> 维持匿名轨迹 <span class='mono'>track_07</span>（不识别身份）" },
        { cls: "", html: "<b>PoseEstimator</b> 输出骨架关键点：躯干角度 <b>78°</b>（接近水平）" },
        { cls: "", html: "<b>TemporalAnalyzer</b>：5 秒内垂直下降 <b>52%</b> 画面高度，用时 <b>420ms</b>" },
        { cls: "hit", html: "<b>FallCandidateEngine</b> 命中 <span class='mono'>RAPID_VERTICAL_DROP</span> + <span class='mono'>TORSO_HORIZONTAL</span> → 生成疑似跌倒候选（单帧不直接报警）" },
        { cls: "hit", html: "<b>RiskVerifier</b>：倒地后 <b>25 秒</b>无动作 → 复核通过，升级 <span class='mono'>FALL_WITH_PROLONGED_INACTIVITY</span>" },
        { cls: "", html: "<b>EvidenceRecorder</b> 截取事件前后短片，按隐私模式模糊化" },
        { cls: "", html: "<b>EventPublisher</b> 经 MQTT QoS1 上报事件信封（断网先入 <b>LocalQueue</b>）" }
      ],
      outcome: {
        cls: "l3",
        title: "L3 紧急 · 通知计划（alerts 模块）",
        lines: [
          "PUSH 女儿（主联系人）· Time Sensitive · 需确认",
          "PUSH 儿子（备用联系人）· Time Sensitive",
          "SMS 儿子 · 升级通道",
          "云端状态机 CREATED → NOTIFIED，5 分钟未确认自动 ESCALATED"
        ]
      },
      envelope: {
        schemaVersion: "1.0",
        eventId: "48354514-d82e-4b36-8f62-d79a2614410d",
        edgeId: "edge_01", cameraId: "camera_01", careSubjectId: "subject_01",
        type: "FALL_WITH_PROLONGED_INACTIVITY", severity: "L3",
        occurredAt: "2026-08-05T14:32:07.182+08:00", confidence: 0.94,
        reasons: ["RAPID_VERTICAL_DROP", "TORSO_HORIZONTAL", "NO_RECOVERY_FOR_25_SECONDS"],
        evidence: { keyFrameId: "frame_9f2c", clipId: "clip_7a11", privacyMode: "BLURRED_VIDEO" },
        model: { detectorVersion: "person-1.3.0", poseVersion: "pose-1.1.0", riskModelVersion: "fall-0.8.0", ruleVersion: "rules-1.2.0" },
        idempotencyKey: "edge_01:camera_01:1754389927182"
      },
      coderef: [
        "edge/runtime/watchcare_edge/pipeline/fall_candidate.py",
        "edge/runtime/watchcare_edge/pipeline/risk_verifier.py",
        "edge/runtime/watchcare_edge/simulator/event_simulator.py",
        "services/api/app/events/service.py",
        "services/api/app/alerts/service.py"
      ]
    },
    {
      id: "scene-zone",
      title: "场景② 儿童进入阳台危险区域",
      badge: { cls: "l2", text: "L2 高风险" },
      meta: "客厅 CAM-02 · 傍晚 · 双职工家庭 · 区域规则 P0 场景",
      svg: sceneZone,
      steps: [
        { cls: "", html: "监护人此前已在 App 的 <b>ZoneEditor</b> 中绘制阳台危险区（归一化多边形，version 3）" },
        { cls: "", html: "云端经 MQTT <span class='mono'>commands</span> 主题把区域配置下发到边缘节点" },
        { cls: "", html: "<b>PersonDetector</b> + <b>AnonymousTracker</b> 检出儿童 <span class='mono'>track_03</span>" },
        { cls: "", html: "<b>ZoneEngine</b> 以脚部特征点 <span class='mono'>bottom_center</span> 做多边形包含判定 → 发出 <b>ENTER</b> 信号" },
        { cls: "hit2", html: "停留计时 <b>1.2s ≥ 阈值 1.0s</b> → 发出 <b>STAY</b> 信号（每个进入周期只发一次）" },
        { cls: "hit2", html: "生成 <span class='mono'>DANGER_ZONE_ENTRY</span> 事件，等级 <b>L2</b>" },
        { cls: "", html: "<b>EventPublisher</b> 上报云端（证据可选：仅关键帧 / 不上传）" }
      ],
      outcome: {
        cls: "l2",
        title: "L2 高风险 · 通知计划",
        lines: [
          "PUSH 女儿（主联系人）· Time Sensitive · 需确认",
          "L2 不启用短信/电话升级通道",
          "确认或标记误报后归档，区域规则可按家庭调整阈值"
        ]
      },
      envelope: {
        schemaVersion: "1.0",
        eventId: "7c1e9b20-4f5a-4d31-9c2e-2f6b8a0d3e55",
        edgeId: "edge_02", cameraId: "camera_02", careSubjectId: "subject_02",
        type: "DANGER_ZONE_ENTRY", severity: "L2",
        occurredAt: "2026-08-05T17:08:42.540+08:00", confidence: 0.91,
        reasons: ["ENTERED_DANGER_ZONE", "DWELL_1200MS_OVER_THRESHOLD_1000MS"],
        evidence: { keyFrameId: "frame_31ab", clipId: null, privacyMode: "KEYPOINTS_ONLY" },
        model: { detectorVersion: "person-1.3.0", poseVersion: "pose-1.1.0", riskModelVersion: "zone-rules-1.0.0", ruleVersion: "rules-1.2.0" },
        idempotencyKey: "edge_02:camera_02:1754399322540"
      },
      coderef: [
        "edge/runtime/watchcare_edge/pipeline/zone_engine.py",
        "edge/runtime/tests/test_zone_engine.py",
        "apps/ios/.../ZoneEditor（占位，归一化坐标编辑）"
      ]
    },
    {
      id: "scene-safe",
      title: "场景③ 老人快速坐下（正常活动）",
      badge: { cls: "safe", text: "不报警" },
      meta: "客厅 CAM-01 · 下午 · 误报控制 · 与场景①同一管线",
      svg: sceneSafe,
      steps: [
        { cls: "", html: "与场景①完全相同的管线处理同一摄像头画面" },
        { cls: "", html: "<b>TemporalAnalyzer</b>：垂直下降 <b>20%</b> 画面高度，用时 <b>1500ms</b>（受控动作）" },
        { cls: "", html: "躯干角度 <b>15°</b>，全程保持直立" },
        { cls: "pass", html: "<span class='mono'>RAPID_VERTICAL_DROP</span> 未命中：幅度与速度均低于阈值" },
        { cls: "pass", html: "<span class='mono'>TORSO_HORIZONTAL</span> 未命中 → <b>FallCandidateEngine 不生成候选</b>" },
        { cls: "pass", html: "<b>无任何上报</b>：画面与特征只留在本地环形缓存，到期自动覆盖（数据最小化）" }
      ],
      outcome: {
        cls: "safe",
        title: "不生成事件 · 不发送通知",
        lines: [
          "这是误报控制的第一道防线：阈值规则在边缘侧拦截",
          "第二道防线是 RiskVerifier 静止计时（自行起身不升级）",
          "第三道防线是监护人的误报反馈，回流优化阈值"
        ]
      },
      envelope: null,
      coderef: [
        "edge/runtime/watchcare_edge/pipeline/fall_candidate.py（阈值规则）",
        "edge/runtime/tests/test_fall_chain.py::test_normal_sit_down_produces_no_candidate"
      ]
    },
    {
      id: "scene-offline",
      title: "场景④ 摄像头深夜断流",
      badge: { cls: "l1", text: "L1 注意" },
      meta: "卧室 CAM-02 · 凌晨 · 设备异常 P0 场景",
      svg: sceneOffline,
      steps: [
        { cls: "", html: "<b>StreamSupervisor</b> 持续接收每路摄像头的帧心跳" },
        { cls: "hit2", html: "02:14:55 起 <b>32 秒</b>无新帧，超过 <b>30 秒</b>离线阈值" },
        { cls: "", html: "判定 <span class='mono'>CAMERA_OFFLINE</span>（断流），本地持续自动重连" },
        { cls: "", html: "<b>HealthMonitor</b> 同步上报 CPU / 温度 / 磁盘遥测，辅助区分断电、断网与遮挡" },
        { cls: "", html: "生成设备异常事件，等级 <b>L1</b>" },
        { cls: "", html: "恢复后补传遥测；若 30 秒内心跳恢复则不产生事件" }
      ],
      outcome: {
        cls: "l1",
        title: "L1 注意 · 通知计划",
        lines: [
          "PUSH 女儿（主联系人）· Active · 无需确认",
          "避免「系统早已失效，家人却以为一切正常」",
          "遮挡与画面冻结分别为 CAMERA_OCCLUDED / FRAME_FROZEN"
        ]
      },
      envelope: {
        schemaVersion: "1.0",
        eventId: "a2f47c10-8b3e-4c9a-bf1d-5e6d7c8b9a01",
        edgeId: "edge_01", cameraId: "camera_02", careSubjectId: "subject_01",
        type: "CAMERA_OFFLINE", severity: "L1",
        occurredAt: "2026-08-05T02:14:55.010+08:00", confidence: 1.0,
        reasons: ["NO_FRAME_FOR_32_SECONDS", "LAST_FRAME_AT_2026-08-05T02:14:23+08:00"],
        evidence: { keyFrameId: null, clipId: null, privacyMode: "NONE" },
        model: { detectorVersion: "", poseVersion: "", riskModelVersion: "", ruleVersion: "rules-1.2.0" },
        idempotencyKey: "edge_01:camera_02:1754356495010"
      },
      coderef: [
        "edge/runtime/watchcare_edge/pipeline/stream_supervisor.py",
        "edge/runtime/watchcare_edge/pipeline/health_monitor.py"
      ]
    }
  ];

  /* ---------------- 渲染 ---------------- */

  function renderScenario(s) {
    var stepsHtml = s.steps.map(function (st) {
      return '<li class="' + st.cls + '">' + st.html + '</li>';
    }).join("");
    var outcomeLines = s.outcome.lines.map(function (l) {
      return "<div>" + l + "</div>";
    }).join("");
    var envelopeHtml = s.envelope
      ? '<details><summary>查看上报的事件信封（risk-event-envelope.schema.json）</summary><pre>' +
        escapeHtml(JSON.stringify(s.envelope, null, 2)) + "</pre></details>"
      : "";
    var codeHtml = s.coderef.map(function (c) {
      return "<span>· " + c + "</span>";
    }).join("");

    return (
      '<article class="scenario" id="' + s.id + '">' +
      '<div><h3>' + s.title + '<span class="badge ' + s.badge.cls + '">' + s.badge.text + "</span></h3>" +
      '<div class="meta">' + s.meta + '</div>' +
      '<div class="cam-frame">' + s.svg() + "</div></div>" +
      '<div class="panel"><h4>系统推理链</h4><ol class="steps">' + stepsHtml + "</ol>" +
      '<h4>结果</h4><div class="outcome ' + s.outcome.cls + '"><b>' + s.outcome.title + "</b>" +
      outcomeLines + "</div>" + envelopeHtml +
      '<div class="code-ref">' + codeHtml + "</div></div></article>"
    );
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderAll() {
    var host = document.getElementById("scenarios");
    if (!host) return;
    host.innerHTML = SCENARIOS.map(renderScenario).join("");
  }

  global.WatchCareScenes = { SCENARIOS: SCENARIOS, renderAll: renderAll, renderScenario: renderScenario };
})(typeof window !== "undefined" ? window : globalThis);
