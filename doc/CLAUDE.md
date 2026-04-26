请在现有"任务管理 + 审批流转系统"基础上进行增强开发（不要推翻重写），实现"子任务 + 站点执行 + 数据提交驱动进度"的完整流程。

⚠️ 本次要求严格按以下业务模型实现，不要自由发挥。

---

# 🧠 一、核心业务模型（必须严格遵守）

一个任务（Task）来源于任务书，包含：

## 1. 固定子任务（SubTask）

每个任务固定包含3个子任务：

- 水质（water）
- 沉积物（sediment）
- 生物（biology）

⚠️ 子任务不是用户创建的，而是系统内置

---

## 2. 站点（Station）

任务创建时：

- 用户填写多个站点（如：S1、S2、S3）
- 每个站点可以选择执行哪些子任务（多选）：

例如：

S1 → 水质 + 生物
S2 → 水质
S3 → 沉积物 + 生物

---

## 3. 执行记录（Execution，核心）

系统自动生成：

仅对"被选中的子任务"生成记录：

结构：

- id
- taskId
- stationCode
- subTaskType（water / sediment / biology）
- status（未填写 / 已完成）

⚠️ 每个 execution 只需提交一次数据

---

# 🔁 二、关键自动逻辑（必须实现）

## 1. 创建任务时

用户填写：

- 任务基本信息
- 站点列表
- 每个站点选择子任务

---

## 2. 审核通过时（approveTask）

系统自动执行：

1. 为任务创建3个子任务（固定）
2. 根据"站点 × 子任务选择"生成 execution 数据

例如：

3个站点 × 部分子任务
→ 自动生成 execution 列表

---

# 📊 三、进度计算（核心）

## 1. 子任务进度

某子任务进度：

= 已完成站点数 / 应执行站点数

---

## 2. 任务总进度

= 3个子任务进度的平均值

---

必须实现函数：

- getSubTaskProgress(taskId, subTaskType)
- getTaskProgress(taskId)

---

# 🧱 四、页面改造（重点）

---

## 1. 任务创建页（增强）

新增：

### 站点配置（核心UI）

表格形式：

| 站点编号 | 水质 | 沉积物 | 生物 |
|----------|------|--------|------|
| S1       | ☑    | ☐      | ☑    |

👉 勾选表示该站点需要执行该子任务

---

## 2. 任务详情页（核心页面）

必须展示：

### （1）任务总进度
- 进度条

---

### （2）子任务列表

| 子任务 | 进度 |
|--------|------|
| 水质   | 60% |
| 沉积物 | 30% |
| 生物   | 80% |

👉 可点击进入子任务详情页

---

## 3. 子任务详情页（关键页面）

展示：

| 站点 | 状态 |
|------|------|
| S1   | 已完成 |
| S2   | 未完成 |

👉 仅展示"需要执行该子任务的站点"

---

点击站点 → 进入数据填写页

---

## 4. 数据填写页（简化版）

要求：

- 只显示当前子任务的指标（固定配置）
- 输入若干字段（mock）
- 提交后：

执行：

- 更新 execution.status = 已完成
- 自动刷新进度

---

# 🧪 五、子任务指标配置（必须固定）

根据任务书写死在 mock/config 中：

## 水质：
- pH、DO、COD、氨氮等

## 沉积物：
- 有机碳、硫化物、重金属等

## 生物：
- 叶绿素a、浮游生物等

⚠️ 不允许写在组件中，必须配置化

---

# 💾 六、数据管理

- 使用 Pinia
- 所有数据集中管理：
  - Task
  - SubTask
  - Execution
- 使用 localStorage 持久化

---

# 🎯 七、输出要求

请在现有代码基础上：

1. 增量修改代码（不要重写）
2. 新增：
   - execution 数据结构
   - 子任务进度计算
3. 修改页面：
   - 任务创建页（站点配置）
   - 任务详情页（进度展示）
   - 子任务详情页
   - 数据填写页
4. 说明关键逻辑

---

# 🚀 八、代码质量要求

- execution 生成逻辑必须在 store 中
- 进度计算必须为纯函数
- UI 与业务逻辑分离
- 不允许硬编码站点或任务

---

# 当前实现状态

## 已完成

### 类型定义 (src/types/index.js)
- SubTaskType: water, sediment, biology（固定3个）
- FIXED_SUB_TASK_TYPES: 固定子任务类型数组
- Execution: { id, taskId, stationCode, stationName, subTaskType, status, dataValue }
- SubTaskIndicatorConfig: 按类型预置指标（水质15项、沉积物8项、生物6项）

### Store (src/stores/task.js)
- executions: 执行记录列表
- createSubTasksForTask(): 审批通过时创建固定3个子任务
- generateExecutionsForTask(): 根据站点配置生成execution
- getSubTaskProgress(taskId, subTaskType): 子任务进度 = 已完成站点数/应执行站点数
- getTaskProgress(taskId): 任务总进度 = 3个子任务进度平均值
- completeExecution(executionId, dataValue): 完成执行记录

### 页面
- TaskCreate.vue: 站点配置表格（勾选子任务）
- TaskDetail.vue: 任务总进度 + 子任务列表
- SubTaskDetail.vue: 子任务详情页（展示站点执行情况）
- DataFill.vue: 数据填写页

### 路由
- /tasks/:taskId/subtask/:subTaskType → SubTaskDetail
- /tasks/:taskId/subtask/:subTaskType/station/:stationCode → DataFill