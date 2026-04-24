# 项目更新日志

## 2026-04-24 - 初始版本

### 新增功能

- **任务管理页面** (`/tasks`)
  - 任务概览卡片，显示任务名称、编号、时间范围
  - 总体完成率进度条和统计数据
  - 子任务列表卡片，支持跳转数据录入
  - 任务树形结构展示

- **数据录入页面** (`/data-entry`)
  - 子任务类型选择（疏浚泥监测、水质监测、沉积物监测等）
  - Excel风格数据表格
  - 支持按站位、层次、指标筛选
  - 实时保存数据到 localStorage
  - 显示完成率和缺失数量

- **进度统计页面** (`/progress`)
  - 圆形完成率展示
  - 各子任务进度列表
  - 缺失项按站位统计表格
  - 缺失项按指标统计表格

### 数据模型

- Task（任务）：id, taskCode, name, startTime, endTime
- SubTask（子任务）：id, taskId, type, frequency
- Station（站位）：id, subTaskId, stationCode, hasLayers, layers, monitoringElements, depth
- Indicator（指标）：id, name, category, unit
- DataRecord（数据录入）：id, taskId, subTaskId, stationId, layer, indicatorId, value, status

### 业务规则

- **疏浚泥监测**：柱状样站位（HD1、HD8、HD14）需要采集4层（表层、0.5m、1m、1.5m），其他站位仅表层
- **水质监测**：水深≤10m只采表层，>10m需采表层和底层

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
├── stores/task.js      # Pinia Store
├── types/index.js      # 类型定义
├── utils/
│   ├── storage.js      # localStorage封装
│   ├── mockData.js     # Mock数据
│   └── validation.js   # 校验逻辑
└── views/
    ├── TaskList.vue    # 任务管理
    ├── DataEntry.vue   # 数据录入
    └── Progress.vue    # 进度统计
```

### 待后端对接

- `src/stores/task.js` 的 `initialize()` 和 `saveData()` 方法
- `src/utils/storage.js` 可替换为 API 调用
