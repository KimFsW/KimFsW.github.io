/* 守望 AI 可操控模拟器：时间线动画引擎 + 四个场景脚本 + 手机交互。
 *
 * 引擎：requestAnimationFrame 驱动模拟时钟，schedule 注册一次性事件，
 * animate 注册连续插值动画，waitFor 注册条件触发。所有动画与倒计时都
 * 走同一个时钟，因此播放速度对一切生效。
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var DEFAULT_END_ROUTE = ["CREATED", "NOTIFIED", "ACKNOWLEDGED", "RESOLVED"];

  /* ---------------- 区域多边形包含判定（与 edge zone_engine 同一算法） ---------------- */
  var ZONE = [[83.2, 18], [145.6, 18], [148.8, 79.2], [80, 78.3]];
  function pointInPolygon(x, y) {
    var inside = false;
    for (var i = 0; i < ZONE.length; i++) {
      var a = ZONE[i], b = ZONE[(i + 1) % ZONE.length];
      if ((a[1] > y) !== (b[1] > y)) {
        var xi = (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0];
        if (x < xi) inside = !inside;
      }
    }
    return inside;
  }

  /* ---------------- 时钟与动画引擎 ---------------- */
  var S = {
    t: 0, play: false, speed: 1, raf: 0, last: 0,
    tl: [], anims: [], waiters: [],
    handled: false, pushOpen: false,
    activeEvent: null, phoneView: "home", evidenceImage: "", lastLiveCapture: 0,
    enteredAt: null, stayFired: false, left: false, thr: 1.0
  };

  function sched(t, fn) { S.tl.push({ t: t, fn: fn, fired: false }); }
  function after(dur, fn) { sched(S.t + dur, fn); }
  function animate(dur, step, done) {
    S.anims.push({ e: 0, dur: dur, step: step, done: done, finished: false });
  }
  function waitFor(cond, fn) { S.waiters.push({ cond: cond, fn: fn, fired: false }); }

  function frame(ts) {
    if (!S.play) return;
    var now = ts / 1000;
    var dt = (now - S.last) * S.speed;
    S.last = now;
    if (dt > 0.25) dt = 0.25;
    S.t += dt;
    if (S.phoneView === "detail" && now - S.lastLiveCapture >= 0.5) {
      syncLivePreview();
      S.lastLiveCapture = now;
    }
    for (var i = 0; i < S.tl.length; i++) {
      var e = S.tl[i];
      if (!e.fired && e.t <= S.t) { e.fired = true; e.fn(); }
    }
    for (var j = 0; j < S.anims.length; j++) {
      var a = S.anims[j];
      a.e += dt;
      var p = Math.min(1, a.e / a.dur);
      a.step(p);
      if (p >= 1 && !a.finished) { a.finished = true; if (a.done) a.done(); }
    }
    S.anims = S.anims.filter(function (a) { return !a.finished; });
    for (var k = 0; k < S.waiters.length; k++) {
      var w = S.waiters[k];
      if (!w.fired && w.cond()) { w.fired = true; w.fn(); }
    }
    S.waiters = S.waiters.filter(function (w) { return !w.fired; });
    if (S.play) S.raf = requestAnimationFrame(frame);
  }

  function startClock() {
    S.last = performance.now() / 1000;
    S.play = true;
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(frame);
    setPlayBtn(true);
  }
  function pauseClock() {
    S.play = false;
    cancelAnimationFrame(S.raf);
    setPlayBtn(false);
  }

  /* ---------------- UI 助手 ---------------- */
  function show(id) { var e = $(id); if (e) e.style.display = ""; }
  function hide(id) { var e = $(id); if (e) e.style.display = "none"; }

  function stage(k, mode) {
    var c = document.querySelector('#pipe [data-k="' + k + '"]');
    if (c) c.classList.add(mode || "on");
  }
  function pipeReset(visible) {
    document.querySelectorAll("#pipe [data-k]").forEach(function (c) {
      c.className = "p-chip" + (visible.indexOf(c.dataset.k) >= 0 ? "" : " hidden-chip");
    });
  }
  function log(time, msg, cls) {
    var li = document.createElement("li");
    var tm = document.createElement("time");
    tm.textContent = time;
    li.appendChild(tm);
    li.appendChild(document.createTextNode(msg));
    if (cls) li.className = cls;
    var box = $("log");
    box.appendChild(li);
    box.parentElement.scrollTop = 1e6;
  }
  function smSet(name) {
    document.querySelectorAll("#sm [data-s]").forEach(function (c) {
      c.classList.toggle("cur", c.dataset.s === name);
    });
    var progressIndex = DEFAULT_END_ROUTE.indexOf(name);
    if (progressIndex >= 0) renderEndProgress(DEFAULT_END_ROUTE, progressIndex);
  }
  function smReset() {
    document.querySelectorAll("#sm [data-s]").forEach(function (c) { c.classList.remove("cur"); });
  }
  function setCam(t) { $("hud-cam").textContent = t; }
  function setClock(t) { $("hud-clock").textContent = t; }

  function renderEndProgress(route, completedIndex) {
    var parts = [];
    route.forEach(function (state, index) {
      parts.push('<span class="' + (index <= completedIndex ? "done" : "") + '">' + state + "</span>");
      if (index < route.length - 1) {
        parts.push('<i class="' + (index < completedIndex ? "done" : "") + '">→</i>');
      }
    });
    $("end-progress").innerHTML = parts.join("");
  }

  function resetEndCard() {
    $("endcard").className = "endcard";
    $("end-t").textContent = "结局 · 还没有出现";
    $("end-lines").innerHTML = "";
    renderEndProgress(DEFAULT_END_ROUTE, -1);
  }

  function setFallBox(x, y, width, height) {
    var outline = $("bbox-fall-outline");
    outline.setAttribute("x", x);
    outline.setAttribute("y", y);
    outline.setAttribute("width", width);
    outline.setAttribute("height", height);
    $("bbox-fall-tag-bg").setAttribute("x", x);
    $("bbox-fall-tag-bg").setAttribute("y", y - 6.2);
    $("bbox-fall-tag-text").setAttribute("x", x + 2.5);
    $("bbox-fall-tag-text").setAttribute("y", y - 1.8);
  }

  function showCallout(x, y, w, accent, lines) {
    var g = $("callout");
    g.setAttribute("transform", "translate(" + x + "," + y + ")");
    g.style.display = "";
    var h = 5 + lines.length * 5.2;
    $("co-bg").setAttribute("width", w);
    $("co-bg").setAttribute("height", h);
    $("co-bar").setAttribute("height", h);
    $("co-bar").setAttribute("fill", accent);
    ["co-l1", "co-l2", "co-l3"].forEach(function (id, i) {
      $(id).textContent = lines[i] || "";
    });
  }

  function flyDot() {
    show("fly");
    animate(0.9, function (p) {
      var e = 1 - Math.pow(1 - p, 2);
      $("fly").setAttribute("cx", 150 + 10 * e);
      $("fly").setAttribute("cy", 80 - 70 * e);
    }, function () { hide("fly"); });
  }

  function endCard(title, cls, lines) {
    var detailLines = lines.slice();
    if (detailLines.length && /^[A-Z_]+(?:\s*→\s*[A-Z_]+)+$/.test(detailLines[0])) {
      var finalRoute = detailLines.shift().split("→").map(function (state) { return state.trim(); });
      renderEndProgress(finalRoute, finalRoute.length - 1);
    }
    $("end-t").textContent = title;
    $("endcard").className = "endcard show " + cls;
    $("end-lines").innerHTML = detailLines.map(function (l) { return "<div>" + l + "</div>"; }).join("");
  }

  /* ---------------- 手机推送卡 ---------------- */
  var LEVEL_COLOR = { L3: "#D64545", L2: "#D9930D", L1: "#3E7CB1" };

  function setPhoneView(view) {
    S.phoneView = view;
    $("phone-visual").classList.toggle("is-detail", view === "detail");
    $("phone-detail").setAttribute("aria-hidden", view === "detail" ? "false" : "true");
    setPushAccessibility(view !== "detail" && S.pushOpen);
  }

  function setPushAccessibility(isVisible) {
    $("push").setAttribute("aria-hidden", isVisible ? "false" : "true");
    ["push-open-hit", "btn-ack", "btn-fp", "btn-later"].forEach(function (id) {
      var control = $(id);
      var enabled = isVisible && control.style.display !== "none";
      control.setAttribute("tabindex", enabled ? "0" : "-1");
    });
  }

  function setPhoneState(text) {
    $("push-state").textContent = text;
    $("detail-state").textContent = text;
  }

  function setImageHref(id, href) {
    var image = $(id);
    if (!image) return;
    if (href) image.setAttribute("href", href);
    else image.removeAttribute("href");
  }

  function captureCameraFrame() {
    try {
      var clone = $("cam").cloneNode(true);
      clone.removeAttribute("id");
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      return "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(new XMLSerializer().serializeToString(clone));
    } catch (err) {
      log("系统", "事发缩图生成失败，通知继续以文字显示", "warn");
      return "";
    }
  }

  function syncLivePreview() {
    setImageHref("detail-live-image", captureCameraFrame());
  }

  function renderIncident(cfg) {
    var color = LEVEL_COLOR[cfg.level] || LEVEL_COLOR.L1;
    $("push-bar").setAttribute("fill", color);
    $("push-title").textContent = cfg.title;
    $("push-summary").textContent = cfg.summary || "检测到风险事件";
    $("push-sub").textContent = cfg.pushSub || cfg.sub;
    $("push-meta").textContent = (cfg.occurredShort || "刚刚") + " · 点击查看直播与证据";
    $("push-open-hit").setAttribute("aria-label", "打开事件详情：" + cfg.title + "，" +
      (cfg.summary || "检测到风险事件"));

    setImageHref("push-thumb", S.evidenceImage);
    setImageHref("detail-evidence-image", S.evidenceImage);
    setImageHref("detail-live-image", S.evidenceImage);

    $("detail-banner").setAttribute("fill", color);
    $("detail-banner").setAttribute("fill-opacity", ".1");
    $("detail-banner").setAttribute("stroke", color);
    $("detail-banner").setAttribute("stroke-opacity", ".42");
    $("detail-title").setAttribute("fill", color);
    $("detail-level").setAttribute("fill", color);
    $("detail-title").textContent = cfg.detailTitle || cfg.title;
    $("detail-level").textContent = cfg.level;
    $("detail-live-label").textContent = cfg.liveLabel || ("● 现在直播 · " + (cfg.camera || "摄像头"));
    $("detail-evidence-label").textContent = cfg.evidenceLabel || ("事发画面 · " + (cfg.occurredShort || "刚刚"));
    $("detail-subject").textContent = cfg.subject || "未识别人物";
    $("detail-location").textContent = cfg.location || cfg.sub;
    $("detail-time").textContent = cfg.occurredAt || cfg.occurredShort || "刚刚";
    $("detail-reason-1").textContent = (cfg.reasonLines && cfg.reasonLines[0]) || cfg.summary || "检测到风险事件";
    $("detail-reason-2").textContent = (cfg.reasonLines && cfg.reasonLines[1]) || "请查看现场画面";
  }

  function openIncident() {
    if (!S.pushOpen || S.handled || !S.activeEvent) return;
    setPhoneView("detail");
    syncLivePreview();
    S.lastLiveCapture = performance.now() / 1000;
    if ($("detail-back").focus) $("detail-back").focus();
  }

  function closeIncident(returnFocus) {
    setPhoneView("home");
    if (returnFocus && S.handled) {
      $("push").classList.remove("show");
      S.pushOpen = false;
      setPushAccessibility(false);
      return;
    }
    if (returnFocus && S.pushOpen && $("push-open-hit").focus) $("push-open-hit").focus();
  }

  function setDetailActionsEnabled(enabled) {
    ["ack", "fp", "later"].forEach(function (key) {
      var button = $("detail-btn-" + key);
      if (!button || button.style.display === "none") return;
      button.style.opacity = enabled ? "1" : ".45";
      button.style.pointerEvents = enabled ? "" : "none";
      button.setAttribute("aria-disabled", enabled ? "false" : "true");
      button.setAttribute("tabindex", enabled ? "0" : "-1");
    });
  }

  function configOneButton(prefix, key, cfg) {
    var g = $(prefix + key);
    if (!g) return;
    if (!cfg || !cfg.label) { g.style.display = "none"; return; }
    g.style.display = "";
    g.setAttribute("aria-label", cfg.label);
    $(prefix + key + "-t").textContent = cfg.label;
    $(prefix + key + "-r").setAttribute("fill", cfg.fill || "none");
    if (cfg.stroke) $(prefix + key + "-r").setAttribute("stroke", cfg.stroke);
    else $(prefix + key + "-r").removeAttribute("stroke");
    $(prefix + key + "-t").setAttribute("fill", cfg.color || "#1A1512");
  }

  function configButton(key, cfg) {
    var pushCfg = cfg;
    if (key === "later" && cfg && cfg.label) {
      pushCfg = Object.assign({}, cfg, { label: cfg.pushLabel || "立即查看" });
    }
    configOneButton("btn-", key, pushCfg);
    configOneButton("detail-btn-", key, cfg);
  }

  function showPush(cfg) {
    S.activeEvent = cfg;
    S.evidenceImage = captureCameraFrame();
    renderIncident(cfg);
    closeIncident(false);
    configButton("ack", cfg.buttons.ack);
    configButton("fp", cfg.buttons.fp);
    configButton("later", cfg.buttons.later);
    setDetailActionsEnabled(true);
    $("push").classList.add("show");
    S.pushOpen = true;
    setPushAccessibility(true);
    S.handled = false;
    if (cfg.cd) {
      show("push-cd");
      var fill = $("push-cd-fill");
      fill.setAttribute("width", 118);
      animate(cfg.cd, function (p) {
        fill.setAttribute("width", 118 * (1 - p));
        setPhoneState("未确认倒计时 " +
          (cfg.cd * (1 - p)).toFixed(1) + "s（模拟 5 分钟）");
      }, function () {
        if (!S.handled) onPushTimeout();
      });
    } else {
      hide("push-cd");
      setPhoneState(cfg.level + " 通知 · 不自动升级");
      animate(8, function () {}, function () {
        if (!S.handled) {
          log("系统", cfg.level + " 通知不自动升级，事件保持 NOTIFIED");
          endCard("事件保持 NOTIFIED · 等待人工确认", "mute",
            ["L1/L2 不触发自动升级，等待确认或误报"]);
        }
      });
    }
  }

  function hidePush() {
    closeIncident(false);
    $("push").classList.remove("show");
    S.pushOpen = false;
    setPushAccessibility(false);
  }

  function userAction(kind) {
    if (S.handled || !S.pushOpen) return;
    S.handled = true;
    hidePush();
    if (kind === "ack") {
      smSet("ACKNOWLEDGED");
      stage("handle");
      log("监护人", "确认风险，立即电话联系老人", "ok");
      after(0.9, function () {
        smSet("RESOLVED");
        log("监护人", "物业上门确认安全 → RESOLVED", "ok");
        endCard("结局 A · 确认并处置完成", "ok",
          ["CREATED → NOTIFIED → ACKNOWLEDGED → RESOLVED"]);
      });
    } else if (kind === "fp") {
      smSet("FALSE_POSITIVE");
      stage("handle");
      log("监护人", "查看关键帧后标记误报 → FALSE_POSITIVE", "ok");
      endCard("结局 B · 误报归档", "mute",
        ["CREATED → NOTIFIED → FALSE_POSITIVE", "误报反馈回流，用于阈值与模型优化"]);
    } else {
      /* 稍后：卡片收起，倒计时继续走 */
      S.handled = false;
      log("监护人", "选择稍后处理（倒计时继续）");
    }
  }

  function onPushTimeout() {
    var keepDetailOpen = S.phoneView === "detail";
    S.handled = true;
    if (keepDetailOpen) {
      setPushAccessibility(false);
      setDetailActionsEnabled(false);
    } else {
      hidePush();
    }
    smSet("ESCALATED");
    setPhoneState(keepDetailOpen ? "已自动升级 · 正在通知备用联系人" : "已升级 ESCALATED");
    log("系统", "5 分钟未确认 → ESCALATED，升级通知儿子（推送 + 短信）", "warn");
    after(1.3, function () {
      smSet("ACKNOWLEDGED");
      stage("handle");
      log("儿子", "收到升级通知，正在赶往现场 → ACKNOWLEDGED", "ok");
      if (keepDetailOpen) setPhoneState("备用联系人已接手 · 事件详情保留");
      endCard("结局 C · 超时升级，备用联系人接手", "warn",
        ["CREATED → NOTIFIED → ESCALATED → ACKNOWLEDGED"]);
    });
  }

  /* ---------------- 场景重置 ---------------- */
  function resetAll() {
    pauseClock();
    S.tl = []; S.anims = []; S.waiters = [];
    S.t = 0; S.handled = false; S.pushOpen = false;
    S.activeEvent = null; S.evidenceImage = ""; S.lastLiveCapture = 0;
    S.enteredAt = null; S.stayFired = false; S.left = false;
    ["door", "zone-poly", "p-lie", "p-child", "bbox-fall", "skel", "torso-t",
     "callout", "shield", "verify", "off-cd", "fly", "ticks"].forEach(hide);
    $("zone-poly").classList.remove("breach");
    $("ovl-off").setAttribute("opacity", 0);
    $("siglost").classList.remove("blink");
    var st = $("p-stand");
    st.style.display = "";
    st.setAttribute("transform", "translate(63,34)");
    st.setAttribute("opacity", 1);
    $("bbox-fall").setAttribute("transform", "translate(0,0)");
    setFallBox(24, 55, 58, 20);
    show("bbox-fall-tag");
    $("p-child").setAttribute("transform", "translate(56,0)");
    $("ticks").classList.add("tickpulse");
    hidePush();
    setPhoneState("");
    setImageHref("push-thumb", "");
    setImageHref("detail-evidence-image", "");
    setImageHref("detail-live-image", "");
    smReset();
    $("log").innerHTML = "";
    resetEndCard();
    show("hud-rec");
    setCam("CAM-01 · 客厅");
  }

  /* ---------------- 场景①：老人跌倒（L3） ---------------- */
  function scriptFall() {
    resetAll();
    pipeReset(["sample", "detect", "track", "pose", "temporal",
               "candidate", "verify", "publish", "notify", "handle"]);
    setCam("CAM-01 · 客厅");
    setClock("2026-08-05 14:31:37");
    setFallBox(56, 28, 14, 41);
    show("bbox-fall");
    log("14:31:37", "画面正常：track_07 在客厅活动（匿名编号，不识别身份）");
    sched(0.4, function () { stage("sample"); log("14:31:38", "FrameSampler：以 10fps 抽帧"); });
    sched(0.9, function () { stage("detect"); log("14:31:39", "PersonDetector：检出人体 conf 0.96"); });
    sched(1.3, function () { stage("track"); log("14:31:39", "AnonymousTracker：维持匿名轨迹 track_07"); });
    sched(1.8, function () {
      log("14:31:42", "⚠ 检测到快速下降", "warn");
      animate(0.42, function (p) {
        var e = p * p;
        $("p-stand").setAttribute("transform",
          "translate(63,34) rotate(" + (-82 * e) + " 0 34)");
        setFallBox(
          56 + (24 - 56) * e,
          28 + (55 - 28) * e,
          14 + (58 - 14) * e,
          41 + (20 - 41) * e
        );
      }, function () {
        hide("p-stand");
        show("p-lie");
        setFallBox(24, 55, 58, 20);
      });
    });
    sched(2.5, function () {
      stage("pose"); show("skel"); show("torso-t");
      log("14:31:42", "PoseEstimator：躯干角度 78°（接近水平）");
    });
    sched(3.0, function () {
      stage("temporal");
      log("14:31:42", "TemporalAnalyzer：5 秒下降 52%，用时 420ms");
    });
    sched(3.5, function () {
      stage("candidate", "hit");
      showCallout(6, 12, 64, "#E5484D",
        ["RAPID_VERTICAL_DROP  52%/420ms", "TORSO_HORIZONTAL  78°"]);
      log("14:31:43", "FallCandidateEngine：生成疑似跌倒候选（单帧不直接报警）", "warn");
    });
    sched(4.1, function () {
      stage("verify", "hit");
      show("verify");
      animate(2.2, function (p) {
        $("verify-fill").setAttribute("width", 66 * p);
        $("verify-t").textContent =
          "复核中：倒地静止 " + (25 * p).toFixed(0) + "s / 25s（×12 加速）";
      }, function () {
        log("14:32:07", "RiskVerifier：25 秒未起身 → 复核通过，升级 L3", "warn");
      });
    });
    sched(6.5, function () {
      stage("publish"); flyDot();
      log("14:32:07", "EventPublisher：信封经 MQTT QoS1 上报（幂等键 edge_01:camera_01:…）");
    });
    sched(7.1, function () {
      stage("notify");
      smSet("CREATED");
      after(0.3, function () { smSet("NOTIFIED"); });
      log("14:32:09", "alerts：L3 → 推送女儿+儿子（Time Sensitive），短信儿子");
      showPush({
        id: "fall-001",
        level: "L3",
        title: "[L3] 疑似跌倒",
        detailTitle: "紧急 · 疑似跌倒",
        summary: "25 秒未起身",
        pushSub: "家中长者 · 客厅 CAM-01",
        sub: "客厅摄像头 · 点击处置",
        subject: "家中长者 · track_07",
        location: "客厅 · CAM-01",
        camera: "CAM-01",
        occurredAt: "2026-08-05 14:31:42",
        occurredShort: "14:31:42",
        evidenceLabel: "事发画面 · 14:31:42",
        reasonLines: ["快速下降 · 身体横卧", "倒地后 25 秒未起身"],
        cd: 15,
        buttons: {
          ack: { label: "我已接手", fill: "#D64545", color: "#fff" },
          fp: { label: "误报", stroke: "#C9C2B8", color: "#5E5A54" },
          later: { label: "稍后", stroke: "#C9C2B8", color: "#5E5A54" }
        }
      });
    });
    startClock();
  }

  /* ---------------- 场景②：儿童进入危险区（L2） ---------------- */
  function zoneEnter() {
    $("zone-poly").classList.add("breach");
    stage("zone", "hit2");
    log("17:08:39", "ZoneEngine：bottom_center ∈ 多边形 → ENTER", "warn");
  }
  function zoneStay() {
    stage("publish");
    log("17:08:40", "停留 " + S.thr.toFixed(1) + "s ≥ 阈值 → STAY，生成 DANGER_ZONE_ENTRY (L2)", "warn");
    after(0.5, function () {
      stage("notify");
      smSet("CREATED");
      after(0.3, function () { smSet("NOTIFIED"); });
      log("17:08:41", "alerts：L2 → 推送女儿（Time Sensitive，需确认）");
      showPush({
        id: "zone-001",
        level: "L2",
        title: "[L2] 危险区提醒",
        detailTitle: "高风险 · 进入危险区",
        summary: "儿童进入阳台危险区",
        pushSub: "儿童 · 客厅 CAM-02",
        sub: "客厅 CAM-02 · 停留已超阈值",
        subject: "儿童 · track_03",
        location: "阳台危险区 · CAM-02",
        camera: "CAM-02",
        occurredAt: "2026-08-05 17:08:40",
        occurredShort: "17:08:40",
        evidenceLabel: "事发画面 · 17:08:40",
        reasonLines: ["进入已设定危险区域", "停留超过 1.0 秒阈值"],
        cd: null,
        buttons: {
          ack: { label: "我已接手", fill: "#D9930D", color: "#fff" },
          fp: { label: "误报", stroke: "#C9C2B8", color: "#5E5A54" },
          later: { label: "稍后", stroke: "#C9C2B8", color: "#5E5A54" }
        }
      });
    });
  }
  function scriptZone() {
    resetAll();
    pipeReset(["sample", "detect", "track", "zone", "publish", "notify", "handle"]);
    setCam("CAM-02 · 客厅");
    setClock("2026-08-05 17:08:36");
    show("door"); show("zone-poly"); show("p-child");
    hide("p-stand");
    S.thr = parseFloat($("thr").value);
    log("17:08:36", "区域规则：阳台危险区 v3，停留阈值 " + S.thr.toFixed(1) + "s（滑块可调）");
    sched(0.3, function () {
      stage("sample"); stage("detect");
      log("17:08:37", "PersonDetector：检出儿童 conf 0.93");
    });
    sched(0.6, function () { stage("track"); log("17:08:37", "AnonymousTracker：儿童轨迹 track_03"); });
    sched(0.9, function () {
      log("17:08:38", "track_03 向阳台方向移动");
      animate(2.6, function (p) {
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var x = 56 + (124 - 56) * e;
        $("p-child").setAttribute("transform", "translate(" + x + ",0)");
        var inside = pointInPolygon(x, 77);
        if (inside && S.enteredAt === null) { S.enteredAt = S.t; zoneEnter(); }
        if (inside && S.enteredAt !== null && !S.stayFired &&
            (S.t - S.enteredAt) >= S.thr) { S.stayFired = true; zoneStay(); }
      });
    });
    sched(6.2, function () {
      animate(1.6, function (p) {
        var x = 124 + 30 * p;
        $("p-child").setAttribute("transform", "translate(" + x + ",0)");
        if (!pointInPolygon(x, 77) && S.enteredAt !== null && !S.left) {
          S.left = true;
          log("17:08:44", "ZoneEngine：track_03 离开 zone_01 → LEAVE");
        }
      });
      after(1.8, function () {
        if (!S.stayFired) {
          endCard("未触发 STAY · 不产生事件", "ok",
            ["停留不足阈值 " + S.thr.toFixed(1) + "s，区域引擎不发事件",
             "调低阈值后重播，可观察 L2 触发"]);
        }
      });
    });
    startClock();
  }

  /* ---------------- 场景③：快速坐下（不报警） ---------------- */
  function scriptSit() {
    resetAll();
    pipeReset(["sample", "detect", "track", "pose", "temporal", "candidate", "handle"]);
    setCam("CAM-01 · 客厅");
    setClock("2026-08-05 15:20:15");
    $("p-stand").setAttribute("transform", "translate(78,34)");
    log("15:20:15", "画面正常：track_07 走向沙发");
    sched(0.4, function () {
      stage("sample"); stage("detect");
      hide("bbox-fall-tag");
      $("bbox-fall").setAttribute("transform",
        "translate(70,27) scale(0.276,2.1) translate(-24,-55)");
      show("bbox-fall");
      log("15:20:15", "PersonDetector：conf 0.95 · track_07");
    });
    sched(0.8, function () { stage("track"); });
    sched(1.2, function () {
      log("15:20:16", "老人在沙发前缓慢坐下（1.5s 受控动作）");
      animate(1.5, function (p) {
        var e = p * p * (3 - 2 * p);
        $("p-stand").setAttribute("transform",
          "translate(" + (78 + 8 * e) + "," + (34 - 12.5 * e) + ") scale(1 " + (1 - 0.28 * e) + ")");
      });
    });
    sched(3.0, function () { stage("pose"); log("15:20:18", "PoseEstimator：躯干 15°（保持直立）"); });
    sched(3.4, function () { stage("temporal"); log("15:20:18", "TemporalAnalyzer：下降 20% / 1500ms"); });
    sched(3.9, function () {
      stage("candidate", "miss");
      showCallout(6, 12, 86, "#3E9B6B",
        ["RAPID_VERTICAL_DROP ✗  20%<35%，1500ms>800ms", "TORSO_HORIZONTAL ✗  15°<60°"]);
      log("15:20:18", "FallCandidateEngine：两条规则均未命中，不生成候选");
    });
    sched(4.6, function () {
      show("shield");
      stage("handle");
      log("15:20:18", "不生成事件、不上报：原始视频与特征留在本地（数据最小化）", "ok");
      endCard("无事件产生 · 误报控制的第一道防线", "ok",
        ["阈值规则在边缘侧拦截正常活动",
         "第二道防线：RiskVerifier 静止计时",
         "第三道防线：监护人误报反馈"]);
    });
    startClock();
  }

  /* ---------------- 场景④：摄像头离线（L1） ---------------- */
  function scriptOff() {
    resetAll();
    pipeReset(["supervisor", "publish", "notify", "handle"]);
    setCam("CAM-02 · 卧室");
    setClock("2026-08-05 02:14:07");
    show("ticks");
    log("02:14:07", "心跳正常：每 2 秒一帧");
    sched(1.0, function () { log("02:14:23", "收到最后一帧"); });
    sched(1.4, function () {
      $("ticks").classList.remove("tickpulse");
      animate(0.8, function (p) {
        $("ovl-off").setAttribute("opacity", p * 0.92);
      }, function () { $("siglost").classList.add("blink"); });
      log("02:14:24", "画面静止，StreamSupervisor 开始计时", "warn");
    });
    sched(2.6, function () {
      show("off-cd");
      stage("supervisor", "hit2");
      animate(2.4, function (p) {
        $("off-fill").setAttribute("width", 70 * p);
        $("off-t").textContent =
          "无新帧 " + (32 * p).toFixed(0) + "s / 30s 阈值（×12 加速）";
      }, function () {
        log("02:14:55", "32s 无新帧 > 30s 阈值 → CAMERA_OFFLINE (L1)", "warn");
      });
    });
    sched(5.4, function () {
      stage("publish"); flyDot();
      log("02:14:55", "EventPublisher：上报设备异常事件");
    });
    sched(6.0, function () {
      stage("notify");
      smSet("CREATED");
      after(0.3, function () { smSet("NOTIFIED"); });
      log("02:14:57", "alerts：L1 → 推送女儿（Active，无需确认）");
      showPush({
        id: "offline-001",
        level: "L1",
        title: "[L1] 卧室摄像头离线",
        detailTitle: "设备提醒 · 摄像头离线",
        summary: "32 秒无新画面",
        pushSub: "卧室摄像头 · CAM-02",
        sub: "32 秒无新帧 · 本地持续重连",
        subject: "卧室摄像头",
        location: "卧室 · CAM-02",
        camera: "CAM-02",
        occurredAt: "2026-08-05 02:14:55",
        occurredShort: "02:14:55",
        liveLabel: "直播中断 · 最后画面 CAM-02",
        evidenceLabel: "告警当刻画面 · 02:14:55",
        reasonLines: ["连续 32 秒没有新画面", "请检查摄像头供电与网络"],
        cd: null,
        buttons: {
          ack: { label: "知道了", fill: "#3E7CB1", color: "#fff" },
          fp: { label: "" },
          later: { label: "稍后", stroke: "#C9C2B8", color: "#5E5A54" }
        }
      });
    });
    startClock();
  }

  /* ---------------- 控制 wiring ---------------- */
  var SCRIPTS = { fall: scriptFall, zone: scriptZone, sit: scriptSit, off: scriptOff };
  var current = "fall";

  function play(name) {
    current = name;
    document.querySelectorAll(".scn-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.scn === name);
    });
    $("zone-cfg").style.display = name === "zone" ? "flex" : "none";
    SCRIPTS[name]();
  }
  function setPlayBtn(playing) {
    $("btn-play").textContent = playing ? "⏸ 暂停" : "▶ 播放";
  }

  function bindKeyboardActivation(id, fn) {
    $(id).addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        fn(e);
      }
    });
  }

  function bindAction(id, kind) {
    $(id).addEventListener("click", function (e) {
      e.stopPropagation();
      userAction(kind);
    });
    bindKeyboardActivation(id, function () { userAction(kind); });
  }

  function boot() {
    document.querySelectorAll(".scn-btn").forEach(function (b) {
      b.addEventListener("click", function () { play(b.dataset.scn); });
    });
    $("btn-play").addEventListener("click", function () {
      if (S.play) pauseClock(); else startClock();
    });
    $("btn-restart").addEventListener("click", function () { play(current); });
    $("speed").addEventListener("change", function (e) {
      S.speed = parseFloat(e.target.value);
    });
    $("thr").addEventListener("input", function (e) {
      var v = parseFloat(e.target.value);
      $("thr-v").textContent = v.toFixed(1) + " s";
      if (current === "zone" && !S.stayFired) S.thr = v;
    });
    $("end-replay").addEventListener("click", function () { play(current); });
    $("push").addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("g.btn")) return;
      openIncident();
    });
    bindKeyboardActivation("push-open-hit", openIncident);
    $("detail-back").addEventListener("click", function () { closeIncident(true); });
    bindKeyboardActivation("detail-back", function () { closeIncident(true); });
    bindAction("btn-ack", "ack");
    bindAction("btn-fp", "fp");
    $("btn-later").addEventListener("click", function (e) {
      e.stopPropagation();
      openIncident();
    });
    bindKeyboardActivation("btn-later", openIncident);
    bindAction("detail-btn-ack", "ack");
    bindAction("detail-btn-fp", "fp");
    bindAction("detail-btn-later", "later");
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && S.phoneView === "detail") closeIncident(true);
    });
    play("fall");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
