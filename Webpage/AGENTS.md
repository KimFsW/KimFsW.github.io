# Webpage 文件夹规则（AGENTS.md）

本文件定义 `Webpage/` 目录的组织规则，所有协作者（含 AI Agent）在此目录下操作时必须遵守。

## 规则

1. **新增文件夹必须附带 README.md**：每次在 `Webpage/` 下新增文件夹时，必须同时在该文件夹内加入 `README.md`，简单说明该文件夹放置什么文件。
2. **新增文件或文件夹必须更新目录结构**：每次在 `Webpage/` 下新增文件或文件夹时，需要同步更新本文件下方「当前目录结构」章节。
3. **网页设计文档同步更新**：每次按要求修改网页时，如果 `Document/Design/` 文件夹里面的内容有变更（如组件新增、计划调整），需要同步更新对应文件。

## 当前目录结构

```
Webpage/
├── AGENTS.md              ← 本规则文件
├── Document/              ← 文档资料
│   ├── README.md
│   ├── Mission/           ← 作业要求、任务书
│   │   ├── README.md
│   │   └── demand.md
│   └── Design/            ← 计划书、组件目录等网页设计文档
│       ├── README.md
│       ├── DESIGN_SYSTEM.md
│       ├── PLAN.md
│       └── COMPONENTS.md
├── Page/                  ← 网页代码（HTML / CSS / JS）
│   ├── README.md
│   ├── index.html
│   ├── team.html
│   ├── project.html
│   ├── goals.html
│   └── roadshow.html
└── Resource/              ← 网页资源
    └── Photos/            ← 照片等图片资源
        ├── README.md
        ├── yuyinghao.jpg
        ├── huangjianfeng.jpg
        ├── chenhongtao.jpg
        ├── lizisheng.jpg
        ├── roadshow-cover.png
        └── roadshow-care-gap.png
```
