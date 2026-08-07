/* 守望 AI 演示：iOS App 操作界面（SVG 手绘 iPhone 界面）。
 *
 * 四台手机串起监护人完整操作流：
 *   锁屏 Time Sensitive 推送 -> 报警处置（事件详情+证据） -> 事件中心 -> 区域编辑器
 * 报警处置页的"关键帧证据"直接复用 scenes.js 场景①的监控画面（嵌套 SVG）。
 * 本文件只产出字符串，不依赖 DOM，可在 Node 中直接测试。
 */
(function (global) {
  "use strict";

  var MONO = "JetBrains Mono,Consolas,monospace";
  var SANS = "PingFang SC,Microsoft YaHei,sans-serif";
  var phoneShellSequence = 0;

  /* ---------------- 基础构件 ---------------- */

  function phoneShell(content, label) {
    var screenClipId = "watchcare-phone-screen-" + (++phoneShellSequence);
    return (
      '<svg viewBox="0 0 150 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '">' +
      '<defs><clipPath id="' + screenClipId + '" clipPathUnits="userSpaceOnUse">' +
      '<rect x="6" y="6" width="138" height="298" rx="21"/>' +
      '</clipPath></defs>' +
      '<rect x="1" y="1" width="148" height="308" rx="26" fill="#141518" stroke="#43464C" stroke-width="1"/>' +
      '<rect x="6" y="6" width="138" height="298" rx="21" fill="#F9F8F6"/>' +
      '<g clip-path="url(#' + screenClipId + ')">' + content + '</g>' +
      '<rect x="58" y="11" width="34" height="9" rx="4.5" fill="#141518"/>' +
      '</svg>'
    );
  }

  function statusBar(time, dark) {
    var ink = dark ? "#F3EFE9" : "#1A1512";
    return (
      '<text x="14" y="20.5" font-family="' + SANS + '" font-size="6.4" font-weight="600" fill="' + ink + '">' + time + '</text>' +
      '<g fill="' + ink + '">' +
      '<rect x="112" y="17" width="2" height="3.6" rx=".6"/>' +
      '<rect x="115.5" y="15.5" width="2" height="5.1" rx=".6"/>' +
      '<rect x="119" y="14" width="2" height="6.6" rx=".6"/>' +
      '<rect x="122.5" y="12.5" width="2" height="8.1" rx=".6"/>' +
      '<rect x="129" y="14" width="9" height="5.4" rx="1.4" fill="none" stroke="' + ink + '" stroke-width=".8"/>' +
      '<rect x="130.2" y="15.2" width="5.5" height="3" rx=".7" fill="' + ink + '"/></g>'
    );
  }

  function button(x, y, w, h, label, opts) {
    opts = opts || {};
    var stroke = opts.stroke ? ' stroke="' + opts.stroke + '" stroke-width=".8"' : "";
    return (
      '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (h / 2) + '" fill="' + (opts.fill || "none") + '"' + stroke + '/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 1.9) + '" text-anchor="middle" font-family="' + SANS +
      '" font-size="' + (opts.size || 5) + '"' + (opts.bold ? ' font-weight="600"' : "") +
      ' fill="' + (opts.color || "#1A1512") + '">' + label + '</text></g>'
    );
  }

  /* 从 scenes.js 取场景①画面作为"关键帧证据"（剥掉外层 svg 标签做嵌套） */
  function sceneInner(index) {
    try {
      var scenes = global.WatchCareScenes;
      if (!scenes) return "";
      return scenes.SCENARIOS[index].svg()
        .replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    } catch (e) {
      return "";
    }
  }

  /* ---------------- 手机 1：锁屏 Time Sensitive 推送 ---------------- */

  function phoneLock() {
    var body =
      '<defs><linearGradient id="lockbg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#33454F"/><stop offset="1" stop-color="#161A1F"/></linearGradient></defs>' +
      '<rect x="6" y="6" width="138" height="298" rx="21" fill="url(#lockbg)"/>' +
      statusBar("14:32", true) +
      '<text x="75" y="66" text-anchor="middle" font-family="' + SANS + '" font-size="26" font-weight="200" fill="#F3EFE9">14:32</text>' +
      '<text x="75" y="78" text-anchor="middle" font-family="' + SANS + '" font-size="6.5" fill="rgba(243,239,233,.72)">8月5日 星期三</text>' +
      /* 守望 AI 推送卡 */
      '<rect x="10" y="94" width="130" height="56" rx="9" fill="rgba(255,255,255,.94)"/>' +
      '<rect x="15" y="99" width="10" height="10" rx="2.6" fill="#D64545"/>' +
      '<text x="20" y="106.8" text-anchor="middle" font-family="' + SANS + '" font-size="6" font-weight="700" fill="#fff">守</text>' +
      '<text x="28.5" y="105.5" font-family="' + SANS + '" font-size="4.6" fill="#5E5A54">守望 AI</text>' +
      '<text x="135" y="105.5" text-anchor="end" font-family="' + SANS + '" font-size="4.2" fill="#8D877E">现在</text>' +
      '<text x="28.5" y="114" font-family="' + SANS + '" font-size="5.6" font-weight="700" fill="#1A1512">[L3] 疑似跌倒，25 秒未起身</text>' +
      '<text x="28.5" y="121.5" font-family="' + SANS + '" font-size="4.4" fill="#5E5A54">客厅摄像头 · 点击查看证据与处置</text>' +
      '<rect x="15" y="127" width="36" height="9" rx="4.5" fill="rgba(214,69,69,.13)"/>' +
      '<text x="33" y="133.6" text-anchor="middle" font-family="' + SANS + '" font-size="4.4" font-weight="600" fill="#D64545">时间敏感</text>' +
      '<text x="56" y="133.6" font-family="' + SANS + '" font-size="4.2" fill="#8D877E">轻扫打开处置页</text>' +
      /* 备用联系人升级摘要 */
      '<rect x="10" y="156" width="130" height="22" rx="9" fill="rgba(255,255,255,.78)"/>' +
      '<rect x="15" y="161" width="10" height="10" rx="2.6" fill="#3E7CB1"/>' +
      '<text x="20" y="168.4" text-anchor="middle" font-family="' + SANS + '" font-size="5.4" font-weight="700" fill="#fff">讯</text>' +
      '<text x="28.5" y="165.8" font-family="' + SANS + '" font-size="4.6" fill="#5E5A54">系统</text>' +
      '<text x="28.5" y="172.8" font-family="' + SANS + '" font-size="4.4" fill="#3A3D42">已同步通知备用联系人（儿子）· 短信</text>' +
      /* 底部快捷按钮 */
      '<circle cx="34" cy="288" r="9" fill="rgba(255,255,255,.22)"/>' +
      '<circle cx="116" cy="288" r="9" fill="rgba(255,255,255,.22)"/>' +
      '<rect x="31" y="285" width="6" height="6" rx="1.2" fill="none" stroke="#fff" stroke-width="1"/>' +
      '<circle cx="116" cy="288" r="4" fill="none" stroke="#fff" stroke-width="1"/>';
    return phoneShell(body, "锁屏推送界面示意");
  }

  /* ---------------- 手机 2：报警处置（事件详情） ---------------- */

  function reasonRow(text, y) {
    return (
      '<circle cx="14" cy="' + (y - 1.4) + '" r="1.4" fill="#D64545"/>' +
      '<text x="19" y="' + y + '" font-family="' + SANS + '" font-size="4.8" fill="#3A3D42">' + text + '</text>'
    );
  }

  function phoneDetail() {
    var body =
      statusBar("14:33", false) +
      '<text x="13" y="33" font-family="' + SANS + '" font-size="9" fill="#5E5A54">‹</text>' +
      '<text x="75" y="33" text-anchor="middle" font-family="' + SANS + '" font-size="7" font-weight="600" fill="#1A1512">事件详情</text>' +
      /* 等级横幅 */
      '<rect x="10" y="40" width="130" height="16" rx="6" fill="rgba(214,69,69,.1)" stroke="rgba(214,69,69,.4)" stroke-width=".8"/>' +
      '<text x="16" y="50.6" font-family="' + SANS + '" font-size="6" font-weight="700" fill="#D64545">[L3] 跌倒且长时间未起身</text>' +
      '<rect x="112" y="44" width="24" height="8" rx="4" fill="#D64545"/>' +
      '<text x="124" y="49.6" text-anchor="middle" font-family="' + MONO + '" font-size="3.8" fill="#fff">NOTIFIED</text>' +
      /* 证据关键帧：嵌套场景①画面 */
      '<svg x="10" y="60" width="130" height="73" viewBox="0 0 160 90">' + sceneInner(0) + '</svg>' +
      '<rect x="10" y="60" width="130" height="73" rx="6" fill="none" stroke="rgba(26,21,18,.3)" stroke-width=".8"/>' +
      '<rect x="14" y="64" width="42" height="9" rx="4.5" fill="rgba(12,12,14,.72)"/>' +
      '<text x="35" y="70.2" text-anchor="middle" font-family="' + SANS + '" font-size="4.2" fill="#fff">关键帧 · 已模糊化</text>' +
      '<rect x="104" y="120" width="32" height="10" rx="5" fill="rgba(12,12,14,.72)"/>' +
      '<text x="120" y="126.8" text-anchor="middle" font-family="' + SANS + '" font-size="4.4" fill="#fff">▶ 12s 短片</text>' +
      /* 报警原因：自然语言，而非黑箱分数（设计方案 3.4） */
      '<text x="12" y="147" font-family="' + SANS + '" font-size="5.6" font-weight="600" fill="#1A1512">为什么报警</text>' +
      reasonRow("14:31:42 检测到快速下降（52% 画面 / 0.4s）", 156) +
      reasonRow("躯干接近水平（78°）", 164) +
      reasonRow("倒地后 25 秒未起身", 172) +
      /* 元信息 */
      '<text x="12" y="184" font-family="' + SANS + '" font-size="4.4" fill="#8D877E">摄像头  客厅 CAM-01    模型  fall-0.8.0 · rules-1.2.0</text>' +
      '<text x="12" y="191.5" font-family="' + SANS + '" font-size="4.4" fill="#8D877E">已通知  女儿（主联系人）14:32:09 · APNs 送达</text>' +
      '<line x1="10" y1="198" x2="140" y2="198" stroke="rgba(26,21,18,.12)" stroke-width=".7"/>' +
      /* 处置按钮组 */
      button(10, 204, 63, 13, "确认风险", { fill: "#D64545", color: "#fff", bold: true, size: 5.2 }) +
      button(77, 204, 63, 13, "联系老人", { fill: "#1A1512", color: "#fff", size: 5.2 }) +
      button(10, 221, 63, 13, "正在处理", { stroke: "#5E5A54", color: "#1A1512", size: 5.2 }) +
      button(77, 221, 63, 13, "误报", { stroke: "#C9C2B8", color: "#5E5A54", size: 5.2 }) +
      '<text x="75" y="245" text-anchor="middle" font-family="' + SANS + '" font-size="4.3" fill="#D9930D">5 分钟未确认将自动升级给儿子（备用联系人）</text>' +
      '<text x="75" y="256" text-anchor="middle" font-family="' + SANS + '" font-size="4.3" fill="#3E7CB1">删除此事件证据 · 隐私设置</text>';
    return phoneShell(body, "报警处置界面示意");
  }

  /* ---------------- 手机 3：事件中心 ---------------- */

  function listItem(y, level, levelColor, title, time, status, statusColor) {
    return (
      '<rect x="10" y="' + y + '" width="130" height="26" rx="6" fill="#fff" stroke="rgba(26,21,18,.12)" stroke-width=".7"/>' +
      '<rect x="14" y="' + (y + 4) + '" width="13" height="6.5" rx="3.2" fill="' + levelColor + '"/>' +
      '<text x="20.5" y="' + (y + 9.2) + '" text-anchor="middle" font-family="' + MONO + '" font-size="3.6" font-weight="700" fill="#fff">' + level + '</text>' +
      '<text x="30" y="' + (y + 9) + '" font-family="' + SANS + '" font-size="5" font-weight="600" fill="#1A1512">' + title + '</text>' +
      '<text x="136" y="' + (y + 9) + '" text-anchor="end" font-family="' + SANS + '" font-size="4" fill="#8D877E">' + time + '</text>' +
      '<circle cx="16" cy="' + (y + 18.5) + '" r="1.5" fill="' + statusColor + '"/>' +
      '<text x="20" y="' + (y + 19.7) + '" font-family="' + MONO + '" font-size="3.9" fill="#5E5A54">' + status + '</text>' +
      '<text x="135" y="' + (y + 19.7) + '" text-anchor="end" font-family="' + SANS + '" font-size="7" fill="#C9C2B8">›</text>'
    );
  }

  function phoneList() {
    var body =
      statusBar("14:35", false) +
      '<text x="12" y="35" font-family="' + SANS + '" font-size="8.5" font-weight="700" fill="#1A1512">风险事件</text>' +
      '<text x="138" y="34.5" text-anchor="end" font-family="' + SANS + '" font-size="4.6" fill="#5E5A54">筛选 ⌄</text>' +
      /* 分段筛选 */
      '<rect x="10" y="41" width="24" height="10" rx="5" fill="#1A1512"/>' +
      '<text x="22" y="48" text-anchor="middle" font-family="' + SANS + '" font-size="4.4" fill="#fff">全部</text>' +
      '<rect x="37" y="41" width="28" height="10" rx="5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="51" y="48" text-anchor="middle" font-family="' + SANS + '" font-size="4.4" fill="#5E5A54">未处理</text>' +
      '<rect x="68" y="41" width="24" height="10" rx="5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="80" y="48" text-anchor="middle" font-family="' + SANS + '" font-size="4.4" fill="#5E5A54">误报</text>' +
      /* 事件列表：与场景①②④同一批事件，形成叙事闭环 */
      listItem(56, "L3", "#D64545", "跌倒且未起身 · 客厅", "2 分钟前", "NOTIFIED · 等待确认", "#D64545") +
      listItem(87, "L2", "#D9930D", "进入阳台危险区", "3 小时前", "ACKNOWLEDGED · 已确认", "#3E9B6B") +
      listItem(118, "L1", "#3E7CB1", "摄像头离线 · 卧室", "昨天 02:14", "RESOLVED · 已恢复", "#8D877E") +
      listItem(149, "FP", "#8D877E", "快速移动 · 客厅", "昨天 19:42", "FALSE_POSITIVE · 误报", "#8D877E") +
      /* Tab 栏 */
      '<rect x="6" y="282" width="138" height="22" fill="rgba(255,255,255,.92)"/>' +
      '<line x1="6" y1="282" x2="144" y2="282" stroke="rgba(26,21,18,.12)" stroke-width=".7"/>' +
      '<circle cx="33" cy="289" r="2.6" fill="#D64545"/>' +
      '<text x="33" y="299" text-anchor="middle" font-family="' + SANS + '" font-size="4" fill="#1A1512">事件</text>' +
      '<rect x="71.4" y="286.6" width="5.2" height="5.2" rx="1" fill="none" stroke="#8D877E" stroke-width=".9"/>' +
      '<text x="74" y="299" text-anchor="middle" font-family="' + SANS + '" font-size="4" fill="#8D877E">设备</text>' +
      '<circle cx="115" cy="289" r="2.6" fill="none" stroke="#8D877E" stroke-width=".9"/>' +
      '<text x="115" y="299" text-anchor="middle" font-family="' + SANS + '" font-size="4" fill="#8D877E">我的</text>';
    return phoneShell(body, "事件中心界面示意");
  }

  /* ---------------- 手机 4：区域编辑器 ---------------- */

  function editorFrame() {
    return (
      '<rect x="10" y="40" width="130" height="73" fill="#E9E3DA"/>' +
      '<polygon points="10,85 140,85 140,113 10,113" fill="#D9D0C3"/>' +
      '<rect x="96" y="46" width="38" height="58" fill="#7A8894"/>' +
      '<rect x="99" y="49" width="32" height="52" fill="#BFD4DE" opacity=".85"/>' +
      '<line x1="99" y1="62" x2="131" y2="62" stroke="#7A8894" stroke-width=".8"/>' +
      '<line x1="99" y1="75" x2="131" y2="75" stroke="#7A8894" stroke-width=".8"/>' +
      '<rect x="10" y="40" width="130" height="73" fill="none" stroke="rgba(26,21,18,.28)" stroke-width=".8"/>'
    );
  }

  function phoneZones() {
    /* 归一化坐标 (0.52,0.20)(0.91,0.20)(0.93,0.88)(0.50,0.87)
       映射到画面帧 (x:10-140, y:40-113) */
    var pts = [[77.6, 54.6], [128.3, 54.6], [130.9, 104.2], [75, 103.5]];
    var ptsAttr = pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
    var handles = pts.map(function (p) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="#fff" stroke="#D9930D" stroke-width="1.2"/>';
    }).join("");
    var body =
      statusBar("15:02", false) +
      '<text x="13" y="33" font-family="' + SANS + '" font-size="9" fill="#5E5A54">‹</text>' +
      '<text x="75" y="33" text-anchor="middle" font-family="' + SANS + '" font-size="7" font-weight="600" fill="#1A1512">区域设置 · 客厅 CAM-01</text>' +
      '<text x="138" y="33" text-anchor="end" font-family="' + SANS + '" font-size="4.8" font-weight="600" fill="#3E9B6B">保存</text>' +
      editorFrame() +
      '<polygon points="' + ptsAttr + '" fill="rgba(217,147,13,.16)" stroke="#D9930D" stroke-width="1" stroke-dasharray="3 2"/>' +
      handles +
      '<text x="102" y="80" text-anchor="middle" font-family="' + SANS + '" font-size="4.6" font-weight="600" fill="#B8790A">阳台危险区</text>' +
      '<text x="75" y="121" text-anchor="middle" font-family="' + SANS + '" font-size="4.2" fill="#8D877E">拖动顶点调整区域 · 双指缩放画面</text>' +
      /* 区域类型 */
      '<rect x="10" y="127" width="40" height="11" rx="5.5" fill="rgba(217,147,13,.15)" stroke="#D9930D" stroke-width=".8"/>' +
      '<text x="30" y="134.6" text-anchor="middle" font-family="' + SANS + '" font-size="4.5" fill="#B8790A">危险区</text>' +
      '<rect x="55" y="127" width="40" height="11" rx="5.5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="75" y="134.6" text-anchor="middle" font-family="' + SANS + '" font-size="4.5" fill="#5E5A54">床区</text>' +
      '<rect x="100" y="127" width="40" height="11" rx="5.5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="120" y="134.6" text-anchor="middle" font-family="' + SANS + '" font-size="4.5" fill="#5E5A54">忽略区</text>' +
      /* 触发阈值 */
      '<text x="12" y="153" font-family="' + SANS + '" font-size="4.8" fill="#1A1512">进入多久后触发</text>' +
      '<rect x="96" y="145.5" width="44" height="11" rx="5.5" fill="#fff" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="104" y="153.4" text-anchor="middle" font-family="' + SANS + '" font-size="5.5" fill="#5E5A54">−</text>' +
      '<text x="118" y="153.4" text-anchor="middle" font-family="' + MONO + '" font-size="4.6" fill="#1A1512">1.0 s</text>' +
      '<text x="132" y="153.4" text-anchor="middle" font-family="' + SANS + '" font-size="5.5" fill="#5E5A54">＋</text>' +
      /* 报警等级 */
      '<text x="12" y="167" font-family="' + SANS + '" font-size="4.8" fill="#1A1512">报警等级</text>' +
      '<rect x="96" y="159.5" width="13" height="11" rx="5.5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="102.5" y="167.4" text-anchor="middle" font-family="' + MONO + '" font-size="4.2" fill="#5E5A54">L1</text>' +
      '<rect x="111.5" y="159.5" width="13" height="11" rx="5.5" fill="#D9930D"/>' +
      '<text x="118" y="167.4" text-anchor="middle" font-family="' + MONO + '" font-size="4.2" fill="#fff">L2</text>' +
      '<rect x="127" y="159.5" width="13" height="11" rx="5.5" fill="none" stroke="rgba(26,21,18,.25)" stroke-width=".7"/>' +
      '<text x="133.5" y="167.4" text-anchor="middle" font-family="' + MONO + '" font-size="4.2" fill="#5E5A54">L3</text>' +
      button(10, 178, 130, 13, "保存并下发到边缘节点", { fill: "#3E9B6B", color: "#fff", bold: true, size: 5.2 }) +
      '<text x="75" y="200" text-anchor="middle" font-family="' + SANS + '" font-size="4.2" fill="#8D877E">保存后区域版本 v3 → v4，经 MQTT commands 主题下发</text>' +
      '<text x="75" y="207" text-anchor="middle" font-family="' + SANS + '" font-size="4.2" fill="#8D877E">坐标为归一化值（x,y ∈ [0,1]），不受分辨率影响</text>';
    return phoneShell(body, "区域编辑器界面示意");
  }

  /* ---------------- 渲染 ---------------- */

  var PHONES = [
    { svg: phoneLock, cap: "① 锁屏 · Time Sensitive 推送",
      desc: "L3 事件以时间敏感级别直达锁屏，可绕过通知摘要；即使 App 被系统终止，APNs 依然送达。" },
    { svg: phoneDetail, cap: "② 报警处置 · 事件详情",
      desc: "证据关键帧（已模糊化）+ 自然语言报警原因，一键确认风险 / 联系老人 / 正在处理 / 误报。" },
    { svg: phoneList, cap: "③ 事件中心",
      desc: "全部事件按时间排列，状态一目了然；误报反馈回流，用于模型与阈值优化。" },
    { svg: phoneZones, cap: "④ 区域编辑 ZoneEditor",
      desc: "拖动顶点绘制危险区，归一化坐标保存；保存后经 MQTT 下发边缘节点，版本化管理。" }
  ];

  function renderAll() {
    var host = document.getElementById("phones");
    if (!host) return;
    host.innerHTML = '<div class="phone-grid">' + PHONES.map(function (p) {
      return '<figure class="phone">' + p.svg() +
        '<figcaption><b>' + p.cap + '</b><span>' + p.desc + '</span></figcaption></figure>';
    }).join("") + "</div>";
  }

  global.WatchCarePhones = { PHONES: PHONES, renderAll: renderAll };
})(typeof window !== "undefined" ? window : globalThis);
