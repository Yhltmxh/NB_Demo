你是一个资深前端工程师，请基于 Vue3 + Vite 实现一个“环境监测任务管理与流转系统”。

⚠️ 当前重点：
任务管理 + 审批流转 + 监测配置（不是数据录入）

---

# 🎯 一、任务必须包含以下信息（重点）

任务创建时必须填写：

1. 基础信息：
- 任务编号（taskCode）
- 任务名称（name）
- 时间范围（startTime, endTime）
- 监测频次（frequency）

2. 监测配置（核心）：

- 站位（stations）👉 多选 / 可动态添加
- 指标（indicators）👉 多选
- 深度（depth）👉 支持：
  - 表层
  - 表底层
  - 自定义（如 0.5m / 1m）

⚠️ 注意：这些必须是结构化数据，而不是字符串

---

# 🧩 二、数据模型设计（必须这样拆）

## Task

- id
- taskCode
- name
- startTime
- endTime
- frequency

- monitoringConfig:
    - stations: string[]
    - indicators: string[]
    - depths: string[]

- status：
  draft / pending / approved / rejected / running / completed

---

## TaskFlow（流转记录）

- taskId
- action（submit / approve / reject）
- operator
- comment
- time

---

# 🔁 三、任务流转逻辑（必须实现）

状态流：

draft → pending → approved → running → completed  
          ↘ rejected → draft

必须实现：

- createTask
- submitTask
- approveTask
- rejectTask
- startTask

---

# 🧱 四、页面设计

## 1. 任务列表页（核心）

展示：

- 任务编号
- 名称
- 频次
- 状态
- 时间

支持：

- 状态筛选
- 操作按钮：
  - 编辑
  - 提交审核
  - 审核
  - 启动任务

---

## 2. 任务创建页（重点优化）

必须支持：

### 基础信息表单
- 输入：编号 / 名称 / 时间 / 频次

---

### 监测配置（重点）

#### 站位配置
- 支持添加多个站位（如：S1、S2）
- 可动态增删

#### 指标配置
- 多选（如：pH、DO、COD）

#### 深度配置
- 下拉选择：
  - 表层
  - 表底层
  - 自定义输入

👉 最终保存为数组

---

## 3. 审核弹窗

- 查看任务信息（包含监测配置）
- 审核：
  - 通过
  - 驳回（必须填写意见）

---

## 4. 任务详情页

展示：

- 基础信息
- 监测配置（结构化展示）
- 流转记录（timeline）

---

# 💾 五、数据管理

- 使用 Pinia
- 使用 localStorage 持久化
- 封装 storage

---

# 🎨 六、UI要求

- Element Plus
- 表单 + 表格 + 标签
- 状态颜色：

  - draft：灰
  - pending：橙
  - approved：蓝
  - running：绿
  - rejected：红

---

# 📦 七、输出要求

请输出：

1. 完整 Vue 项目代码
2. 数据结构说明（为什么这样设计 monitoringConfig）
3. 状态流转实现
4. mock 数据
5. 如何扩展到“自动生成数据录入表”的说明

---

# 🚀 八、代码质量要求

- 不允许把监测配置写死
- monitoringConfig 必须可扩展
- 状态流转必须集中管理（store）
- 组件职责清晰