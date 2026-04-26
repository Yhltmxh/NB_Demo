# 项目更新日志

## 2026-04-26 - 第六版更新（按CLAUDE.md大改）

### 核心业务模型重构

按照 doc/CLAUDE.md 要求实现"子任务 + 站点执行 + 数据提交驱动进度"流程。

### 新业务模型

#### 1. 固定子任务（系统内置）

每个任务固定包含3个子任务：
- 水质（water）
- 沉积物（sediment）
- 生物（biology）

子任务不是用户创建的，而是系统内置的。

#### 2. 站点配置（用户填写）

用户创建任务时填写多个站点，每个站点选择执行哪些子任务：

```
| 站位编号 | 水质 | 沉积物 | 生物 |
|----------|------|--------|------|
| S1       | ☑    | ☐      | ☑    |
| S2       | ☑    | ☑      | ☐    |
```

#### 3. 执行记录（Execution）

审批通过后，根据站点×子任务选择自动生成：

```javascript
Execution: {
  id, taskId, stationCode, stationName,
  subTaskType,  // water/sediment/biology
  status,       // pending/completed
  dataValue
}
```

### 关键自动逻辑

#### 审批通过时（approveTask）

1. 创建固定的3个子任务
2. 根据"站点×子任务选择"生成 execution 数据

例如：3个站点，部分选择 → 自动生成 execution 列表

### 进度计算

- **子任务进度** = 已完成站点数 / 应执行站点数
- **任务总进度** = 3个子任务进度的平均值

### 新增页面

| 路径 | 页面 | 说明 |
|------|------|------|
| /tasks/:taskId/subtask/:subTaskType | SubTaskDetail | 子任务详情页 |
| /tasks/:taskId/subtask/:subTaskType/station/:stationCode | DataFill | 数据填写页 |

### 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `src/types/index.js` | SubTaskType固定为3个，Execution结构，FIXED_SUB_TASK_TYPES |
| `src/stores/task.js` | 重构execution逻辑，新增getSubTaskProgress(taskId, subTaskType) |
| `src/router/index.js` | 新增SubTaskDetail和DataFill路由 |
| `src/views/TaskCreate.vue` | 站点配置表格（勾选子任务） |
| `src/views/TaskDetail.vue` | 总进度+子任务列表 |
| `src/views/SubTaskDetail.vue` | 新增 - 展示某子任务的站点执行情况 |
| `src/views/DataFill.vue` | 新增 - 数据填写页 |

---

## 2026-04-25 - 第五版更新（子任务/执行记录重构）

### 重构说明

识别并修复了"子任务拆解 + 进度管理"实现中的设计问题。

### 原设计问题

**SubTaskExecution（执行记录）存在的问题：**

1. **进度手动维护**：Execution.progress 需要手动维护，无法自动同步数据录入状态
2. **与 DataRecord 重复**：Execution 记录的信息（站位×子任务）与 DataRecord（站位×层次×指标）重复
3. **不支持频次**：单条 Execution 记录无法支持"一次性、每日、每周"等多轮监测
4. **进度计算错误**：进度取平均值，无法反映真实数据录入完成情况

### 重构方案

#### 1. 移除 SubTaskExecution

- 删除 `subTaskExecutions` 状态
- 删除 `completeExecution()`、`updateExecutionProgress()` 方法
- 删除 `getSubTaskExecutions()`、`getExecutionsByTaskId()` 方法

#### 2. 新增 MonitoringRound（监测轮次）

```javascript
MonitoringRound: {
  id, taskId, subTaskId,
  roundNumber: 1,        // 第几轮监测
  startTime, endTime,
  status: pending/in_progress/completed
}
```

用于支持频次监测（一次性、每日、每周、每月、每季度等）

#### 3. 进度从 DataRecord 派生

```javascript
// 子任务进度 = 该子任务相关指标的数据完成率
getSubTaskProgress(subTaskId) {
  const subTask = subTasks.value.find(st => st.id === subTaskId)
  const records = dataRecords.value[subTask.taskId] || []
  const subTaskIndicators = subTask.indicators || []
  const relevantRecords = records.filter(r => subTaskIndicators.includes(r.indicatorId))

  const filledCount = relevantRecords.filter(r => r.status === 'filled' && r.value !== '').length
  return Math.round((filledCount / relevantRecords.length) * 100)
}

// 任务总进度 = 所有子任务平均进度
```

#### 4. 启动任务时创建监测轮次

```javascript
startTask(taskId) {
  // ...
  taskSubTasks.forEach(st => {
    monitoringRounds.value.push({
      id: generateId(),
      taskId: taskId,
      subTaskId: st.id,
      roundNumber: 1,
      startTime: task.startTime,
      endTime: task.endTime,
      status: MonitoringRoundStatus.IN_PROGRESS
    })
  })
}
```

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/types/index.js` | 移除 ExecutionStatus，新增 MonitoringRoundStatus |
| `src/stores/task.js` | 移除 executions，新增 monitoringRounds，重构进度计算 |
| `src/views/TaskDetail.vue` | 移除执行记录UI，简化子任务展示 |

### 进度计算逻辑

```
DataRecord.status = filled/missing
     ↓
SubTask.progress = (filled_records / total_records) × 100
     ↓
Task.progress = avg(SubTask.progress)
```

### 未来扩展

监测轮次支持频次：
- 一次性任务 → 1轮
- 每日任务 → 多轮（每日1轮）
- 每周任务 → 多轮（每周1轮）
- 每月/每季度同理

---

## 2026-04-25 - 第四版更新（子任务拆解 + 进度管理）

### 新增功能

#### 子任务拆解体系

任务审批通过后自动创建子任务，按监测要素类型划分：

**子任务类型：**
- 水质 (water) - 预置15项水质指标
- 沉积物 (sediment) - 预置8项沉积物指标
- 生物 (biology) - 预置6项生物指标
- 渔业资源 (fishery) - 预置4项渔业指标

#### 自动生成监测轮次

审批通过并启动任务时：
- 根据任务配置的子任务自动生成 MonitoringRound 记录
- 每子任务类型 = 1个监测轮次（第一轮）

#### 进度计算

- **子任务进度** = 该子任务相关数据录入完成率
- **任务总进度** = 所有子任务平均进度

### 数据模型

**SubTask（子任务）**
```javascript
{
  id, taskId, type, indicators: [], status
}
```

**MonitoringRound（监测轮次）**
```javascript
{
  id, taskId, subTaskId, roundNumber, startTime, endTime, status
}
```

### Store新增方法

- `getSubTasksByTaskId(taskId)` - 获取任务的所有子任务
- `getRoundsBySubTaskId(subTaskId)` - 获取子任务的监测轮次
- `getRoundsByTaskId(taskId)` - 获取任务的监测轮次
- `getSubTaskProgress(subTaskId)` - 计算子任务进度（从DataRecord派生）
- `getTaskProgress(taskId)` - 计算任务总进度

### 进度计算逻辑

```javascript
// 子任务进度（从DataRecord计算）
subTaskProgress = filled_records / total_records × 100

// 任务总进度
taskProgress = avg(subTasks.progress)
```

---

## 2026-04-24 - 第三版更新（任务关联数据录入）

### 新增功能

#### 数据录入关联到任务

每个任务都有自己的数据录入记录，入口在任务详情页：

- **任务详情页新增"数据录入"卡片**
  - 显示数据完成率（圆形进度）
  - 显示已录入/缺失/总数统计
  - "进入数据录入"按钮

- **数据录入页面** (`/tasks/:taskId/data-entry`)
  - Excel风格数据表格
  - 按站位、层次、指标展示
  - 支持筛选已填写/缺失状态
  - 实时保存到localStorage
  - 缺失项统计表格

- **自动生成数据录入矩阵**
  - 根据任务的监测配置（站位 x 层次 x 指标）自动生成
  - 深度规则：表层/表底层/自定义
  - 水深<=10m时只采表层

### Store新增方法

- `getDataRecordsByTaskId(taskId)` - 获取任务的数据记录
- `updateDataRecord(taskId, recordId, value)` - 更新单条记录
- `batchUpdateDataRecords(taskId, updates)` - 批量更新
- `getDataCompletionRate(taskId)` - 获取完成率
- `getDataStatistics(taskId)` - 获取统计数据
- `getMissingItems(taskId)` - 获取缺失项
- `getMissingByStation(taskId)` - 按站位统计缺失

### 数据模型

**DataRecord（数据录入记录）**
```javascript
{
  id, taskId, stationCode, stationName, layer,
  indicatorId, indicatorName, indicatorUnit,
  value, status
}
```

---

## 2026-04-24 - 第二版更新（任务管理 + 审批流转 + 监测配置）

### 重大重构说明

根据新版需求文档，项目从"数据录入系统"重构为"任务管理与审批流转系统"。

### 新增功能

#### 1. 任务管理
- 任务列表页，支持状态筛选和关键词搜索
- 任务创建页，包含完整的监测配置表单
- 任务详情页，展示任务信息和流转记录时间线
- 任务编辑页，支持修改草稿/驳回状态的任务

#### 2. 审批流转
实现了完整的状态流转逻辑：

状态流：
```
draft(草稿) → pending(待审核) → approved(已通过) → running(进行中) → completed(已完成)
                    ↘
                  rejected(驳回) → draft(草稿)
```

流转动作：
- `createTask` - 创建任务
- `submitTask` - 提交审核
- `approveTask` - 审核通过
- `rejectTask` - 驳回任务（需填写意见）
- `startTask` - 启动任务
- `completeTask` - 完成任务

#### 3. 监测配置（结构化数据）

**monitoringConfig 结构：**
```javascript
{
  stations: [     // 站位数组
    { code, name, longitude, latitude, depth }
  ],
  indicators: [    // 指标数组
    { id, name, category, unit }
  ],
  depths: {        // 深度配置
    type: 'surface' | 'surface_bottom' | 'custom',
    customDepths: ['0.5m', '1m', '1.5m']
  }
}
```

#### 4. 审核对话框
- 查看任务完整信息
- 通过/驳回操作
- 驳回时必须填写意见

### 数据模型

#### Task（任务）
- id, taskCode, name, startTime, endTime, frequency
- status: draft | pending | approved | rejected | running | completed
- monitoringConfig: { stations, indicators, depths }
- creator, createTime, rejectReason

#### TaskFlow（流转记录）
- taskId, action, operator, comment, time

### 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| /tasks | TaskList | 任务列表 |
| /tasks/create | TaskCreate | 创建任务 |
| /tasks/:id | TaskDetail | 任务详情+数据录入入口 |
| /tasks/:id/edit | TaskEdit | 编辑任务 |
| /tasks/:taskId/data-entry | DataEntry | 数据录入 |

### 状态颜色

| 状态 | 颜色 |
|------|------|
| draft | info (灰) |
| pending | warning (橙) |
| approved | primary (蓝) |
| rejected | danger (红) |
| running | success (绿) |
| completed | success (绿) |

### 技术栈

- Vue 3 + Composition API + `<script setup>`
- Vite
- Pinia（状态管理）
- Element Plus（UI组件库）
- Vue Router

### 目录结构

```
src/
├── main.js              # 入口文件
├── App.vue              # 主布局组件
├── style.css           # 全局样式
├── router/index.js     # 路由配置
├── stores/task.js      # Pinia Store (含流转和数据录入逻辑)
├── types/index.js      # 类型定义
├── utils/storage.js    # localStorage封装
├── components/
│   └── ApprovalDialog.vue  # 审核对话框
└── views/
    ├── TaskList.vue    # 任务列表
    ├── TaskCreate.vue  # 创建任务
    ├── TaskDetail.vue  # 任务详情+数据录入入口
    ├── TaskEdit.vue    # 编辑任务
    └── DataEntry.vue   # 数据录入页面
```

### 待后端对接

- `src/stores/task.js` 的所有方法可改为 API 调用
- `src/utils/storage.js` 可替换为 API 持久化

---

## 2026-04-24 - 初始版本（数据录入系统）

（已废弃，被第二版替代）

### 功能
- 任务概览和子任务管理
- Excel风格数据录入表格
- 进度统计和缺失项分析
- 数据完整性校验逻辑

### 说明
第一版侧重于"数据录入"，已不再维护。
