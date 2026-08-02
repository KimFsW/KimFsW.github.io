# pulsepilot 網站設計系統（DESIGN_SYSTEM.md）

> 本文件記錄團隊介紹網站（`Page/` 下 4 個頁面）當前最終版本的設計風格、設計令牌與組件元素。
> 所有頁面為**純 HTML / CSS / JS 單文件實現**（零依賴、零構建，樣式與腳本內聯），修改網頁時請與本文件保持同步。

---

## 一、設計風格總述

- **風格定位**：紙墨（Paper & Ink）× 信號紅（Signal Red）。以暖白紙色為底、深墨色為文字，用高飽和的信號紅作為唯一強調色，營造「工程文檔 + 生命體徵」的克制質感。
- **品牌隱喻**：pulsepilot = 脈搏（pulse）+ 領航（pilot）。心電波形（ECG）是貫穿全站的核心視覺符號，出現在 Logo 與狀態指示中。
- **氣質關鍵詞**：克制、留白、等寬字細節、紙張紋理、醫療級可信感。
- **技術特徵**：無外部字體 / 圖片 / 框架依賴；CSS 變量驅動；響應式；尊重 `prefers-reduced-motion`；WCAG AA 對比。

---

## 二、色彩系統（Color Tokens）

| Token | 值 | 用途 |
|-------|----|------|
| `--paper` | `#F9F8F6` | 主背景（暖白紙色） |
| `--paper-2` | `#F0EBE6` | 次背景（卡片底色、標籤底、表格鍵列） |
| `--ink` | `#1A1512` | 主文本（深墨色） |
| `--ink-2` | `#5E5A54` | 次文本（灰墨，優化對比度） |
| `--line` | `rgba(26,21,18,.12)` | 分隔線 / 邊框 |
| `--accent` | `#E03E26` | **主品牌色（信號紅）** |
| `--accent-light` | `#FF6B52` | 淺強調色 |
| `--accent-deep` | `#B02D1A` | 深強調色（kicker、編號、提示文字） |
| `--success` | `#22C55E` | 成功色（預留） |
| `--warning` | `#F59E0B` | 警告色（預留） |

> 說明：`--success` / `--warning` / `--accent-light` 為優化時擴展的輔助色，當前頁面以 `--accent` 及其深淺變體為主。

---

## 三、字體與排版（Typography）

### 字體棧
```css
--sans: "Avenir Next","Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
--mono: "SF Mono","Cascadia Mono",Consolas,"JetBrains Mono",monospace;
```
- 正文使用 `--sans`；編號、標籤、狀態膠囊、表格值等「工程細節」使用 `--mono`。

### 字級層級
| 元素 | 字級 | 字重 | 字距 | 備註 |
|------|------|------|------|------|
| Hero wordmark（`pulsepilot`＋`.w-name`「守望 AI」） | 96px | 900 | -2px | 響應式 72/52/40px；「守望 AI」與主標同字級字重、無括號、`.3em` 間距 |
| 區塊標題 `.sec-title` | 40px | 900 | -1px | 響應式 32/28px |
| Hero 口號 `.slogan` | 24px | 700 | — | 響應式 20/18px |
| 卡片 / 窗口標題 | 18–20px | 900 | -.3~-.5px | — |
| 正文 | 16px | 400 | — | 行高 1.6–1.7 |
| 次文本 / 標籤 | 12–14px | 400–600 | .2~.5px | 多用 mono |

- 大標題統一使用**負字距**（letter-spacing -1 ~ -2px）與**字重 900**，形成衝擊力。
- 選中文字樣式：`::selection { background: var(--accent); color:#fff }`。

---

## 四、空間與形狀（Spacing & Shape）

- **間距系統**：8dp 網格。關鍵區域上下留白 96px（Hero 120px），卡片內邊距 20–32px。
- **圓角**：`--radius: 8px`（卡片、窗口、圖標框統一）；膠囊 / 標籤使用全圓角 `999px`。
- **內容寬度**：`.wrap { max-width:1120px; padding:0 24px }`（640px 以下收為 16px）。
- **陰影**：
  ```css
  --shadow-sm: 0 2px 6px rgba(26,21,18,.06);
  --shadow-md: 0 8px 16px rgba(26,21,18,.10);
  --shadow-lg: 0 16px 32px rgba(26,21,18,.12);
  ```
- **過渡**：`--transition: all .3s cubic-bezier(.4,0,.2,1)`。

---

## 五、品牌元素（Brand Elements）

1. **雙色 wordmark**：`pulse`（墨色）+ `pilot`（信號紅），字重 900、負字距，導航、Hero、頁腳三處一致；Hero 後接 `.w-name`「守望 AI」同级大字（墨色、無括號）。
2. **心電 Logo 框**：28×28 方框（1.5px 墨線、8px 圓角），內嵌紅色心電 SVG 路徑 `M1 7h4l2-5 3 9 2.5-6 1.5 2h9`；hover 時邊框與圖形變紅。
3. **脈衝圓點**：8px 紅色圓點，`pulse` 動畫（2s，透明度 1→.6、縮放 1→1.2），用於狀態膠囊。
4. **狀態膠囊**：mono 12px、999px 全圓角、半透明白底 + 8px 背景模糊；文案「守望 AI · 團隊就緒」。
5. **口號**：「脈搏所指，航向所至。」（Hero 與頁腳）。

---

## 六、通用組件（Components）

> 組件清單與結構詳見同目錄 `COMPONENTS.md`。以下為設計層約定。

| 組件 | 類名 | 設計要點 |
|------|------|---------|
| 粘性導航 | `.nav` | 64px 高（移動端 56px）、半透明紙底 + 10px 模糊、底部 1px 線 + sm 陰影 |
| 導航鏈接 | `.nav-links a` | hover/active 時文字變墨 + 紅色 2px 下劃線；active 加 `aria-current="page"` |
| 區塊頭 | `.sec-head` | mono 編號（`.sec-index`，深紅）+ 40px 標題 |
| 成員卡片 | `.card` | 白底、1px 邊框、sm 陰影；hover 升起 -6px + lg 陰影 |
| 隊長／隊員／性別徽章 | `.badge-lead` / `.badge-member` / `.badge-male` | 999px 膠囊；隊長紅底白字、隊員淺粉紅、性別淺藍 |
| 照片窗口 | `.photo` | 4:5、直接從 `Resource/Photos/` 加載隊員照片（`object-fit:cover`） |
| 項目窗口 | `.ph-window` | 2px 虛線邊框、居中佈局；hover 邊框變紅 + md 陰影 |
| 功能卡片 | `.feat-slot` | 白底實邊框；hover 升起 -4px + 邊框變紅 |
| 章節膠囊 | `.chapter-no` / `.tag-data` | 紅底白字膠囊（章節編號）／紅框淺紅底膠囊（數據狀態） |
| 影響統計 | `.impact-stat` | 白底卡片：mono 28px 深紅大數字（`small` 單位）+ 12.5px 註解；hover 升起 -2px + 邊框變紅 |
| 圖表卡片 | `.chart-card` | 白底、1px 邊框、sm 陰影；標題 + mono 圖例 + SVG/條形圖 + mono 虛線數據來源注 |
| 橫向條形圖 | `.hbar` | 標籤列 + 紙底軌道 + 紅色漸層填充（入場時寬度 0 → `--w`） |
| 不足清單 | `.gap-list` | 雙欄清單；每項前綴 mono 紅色 ✕；768px 以下單欄 |
| 資料來源 | `.sources` | 紙底卡片；mono 編號雙欄引用列表 + 虛線分隔的整理說明 |
| 目標卡片 | `.goal-col` | 白底、32px 內距；hover 升起 -4px + 邊框變紅 |
| 目標清單 | `.goal-list` | 18px 方框複選樣式；`.hot` 項填紅底白勾；hover 縮放 1.1 |
| 頁腳 | `footer` | 墨色底、72px 上距；雙色品牌 + mono 元信息 + 分隔線 |

---

## 七、動效（Motion）

- **入場動效**：`.rev`（opacity 0 + translateY 20px）→ IntersectionObserver（threshold .12）觸發 `.vis`，過渡 .7s ease。
- **條形圖填充**：`.hbar .fill` 寬度由 0 過渡至 `--w`（1s cubic-bezier），隨所在 `.rev` 入場觸發。
- **脈衝**：`@keyframes pulse`（狀態點）。
- **卡片 hover**：translateY(-4 ~ -6px) + 陰影增強 + 邊框變紅。
- **無障礙**：`prefers-reduced-motion: reduce` 時關閉平滑滾動、入場動效與脈衝。

---

## 八、響應式斷點（Breakpoints）

| 斷點 | 適用 | 主要變化 |
|------|------|---------|
| `≤1024px` | 平板豎屏 | wordmark 72px、團隊/功能網格 2 列、項目窗口單列、區塊留白 80px |
| `≤768px` | 平板 | wordmark 52px、導航 56px、網格單列、隱藏導航鏈接並切換為漢堡菜單（`.nav-toggle` + `#nav-mobile`）、不足清單單欄 |
| `≤640px` | 手機 | wordmark 40px、wrap 16px、卡片內距收窄 |

---

## 九、無障礙（Accessibility）

- 語義化：`<header>/<main>/<section role="region">/<footer role="contentinfo">`、正確 h1–h5 層級。
- 當前頁導航項標記 `aria-current="page"`；狀態膠囊 `aria-live="polite"`。
- 照片窗口為可鍵盤操作的 `role="button"`（Enter/Space 觸發），`focus-visible` 紅色 3px 外框。
- 全部文字對比度滿足 **WCAG AA**；裝飾 SVG 標記 `aria-hidden="true"`。

---

## 十、頁面結構（4 頁）

| 頁面 | 文件 | 編號 | 內容 |
|------|------|------|------|
| 主頁 | `index.html` | — | Hero（kicker/wordmark/口號/定位句） |
| 團隊成員 | `team.html` | 01 | 4 張成員卡片（照片上傳、角色、學歷、標籤） |
| 項目介紹 | `project.html` | 02 / 02·B–D | 項目窗口 ×2、核心功能 ×3；現狀問題／影響範圍／現有方案的不足三章節（SVG 圖表 ×2 + 條形圖 ×1 + 統計卡 ×12 + 不足清單 ×4）+ 資料來源 ×3 |
| 參賽目標 | `goals.html` | 03 | 短期目標 / 長期願景兩欄清單 |

四頁共享同一導航條與頁腳，設計令牌完全一致。

---

*最後更新：2026-08-02（project.html 加入影響範圍與現有方案的不足章節、移除痛點表格）*
