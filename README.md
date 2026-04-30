# 海洋环境监测任务管理系统

基于 Vue 3 + Vite + Element Plus + Pinia 的海洋环境监测任务管理与数据采集系统，支持任务审批流转、子任务模板配置、站点执行管理和数据校验。

## 技术栈

- **Vue 3** - Composition API（`<script setup>`）
- **Vite** - 构建工具
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **localStorage** - 前端数据持久化

## 快速开始

```bash
pnpm install        # 安装依赖
pnpm run dev        # 启动开发服务器 http://localhost:5173
pnpm run build      # 生产构建至 /dist
pnpm run preview    # 预览生产构建
```

## 核心功能

### 任务生命周期

```text
草稿 → 提交审核 → 待审核 → 审核通过 → 进行中 → 提交校验 → 校验中 → 已完成
                        ↓
                      驳回 → 草稿                     ← 校验退回
```

### 功能模块

| 模块 | 功能 |
| ---- | ---- |
| 任务管理 | 创建、编辑、删除、提交审核、审核、启动、提交校验 |
| 子任务模板管理 | 自定义模板（名称、编码、指标），可启用/禁用 |
| 站点配置 | 每个任务为站点分配子任务模板 |
| 数据录入 | 根据模板指标动态生成表单，按站点填写数据 |
| 数据校验 | 按子任务分类展示所有指标数据，支持通过/退回 |
| 进度管理 | 子任务进度 + 任务总进度实时计算 |

### 数据模型

```text
任务(Task) → 子任务(SubTask) → 执行记录(Execution) → 数据录入
                ↕
        子任务模板(Template) → 指标(Indicator)
```

## 项目结构

```text
src/
├── stores/
│   ├── task.js          # 任务 Store（CRUD、审批、校验、进度计算）
│   └── template.js      # 模板 Store（CRUD、启用/禁用）
├── views/
│   ├── TaskList.vue      # 任务列表
│   ├── TaskCreate.vue    # 创建任务
│   ├── TaskEdit.vue      # 编辑任务
│   ├── TaskDetail.vue    # 任务详情 + 子任务进度
│   ├── SubTaskDetail.vue # 子任务详情 + 站点执行情况
│   ├── DataFill.vue      # 数据填写
│   ├── DataVerify.vue    # 数据校验
│   ├── TemplateList.vue  # 模板列表
│   └── TemplateCreate.vue# 模板创建/编辑
├── types/
│   └── index.js          # 类型定义与常量
├── utils/
│   ├── storage.js        # localStorage 封装
│   └── validation.js     # 数据校验逻辑
├── router/
│   └── index.js          # 路由配置
├── App.vue               # 主布局
├── main.js               # 入口文件
└── style.css             # 全局样式
```

## 开发说明

### 数据持久化

所有数据通过 `taskflow_` 前缀存储在 localStorage 中，可在 `/utils/storage.js` 中配置。

### 进度计算

- **子任务进度** = 已完成站点数 / 应执行站点数 × 100%
- **任务总进度** = 各子任务进度平均值

### 指标配置

子任务模板支持完全自定义的指标配置，创建模板时需手动添加指标（名称 + 单位），不使用预设选项。
