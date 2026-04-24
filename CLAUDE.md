# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Marine Environmental Monitoring Task Flow System** frontend demo built with Vue 3 + Vite. It manages structured task breakdown and multi-dimensional data entry for ocean monitoring tasks (dredged mud, water quality, sediment, biology, fishery, environment monitoring).

## Commands

```bash
pnpm install        # Install dependencies
pnpm run dev        # Start dev server at http://localhost:5173
pnpm run build      # Production build to /dist
pnpm run preview    # Preview production build
```

## Architecture

### Data Model Hierarchy

```
Task → SubTask → Station → Layer → Indicator → DataRecord
```

- **Task**: Single monitoring project (e.g., "xxxx进港航道疏浚海洋环境影响跟踪监测")
- **SubTask**: Types include `dredged_mud`, `water_quality`, `sediment`, `biology`, `fishery`, `environment`
- **Station**: Physical sampling locations (e.g., HD1-HD15 for dredged mud, S11-S20 for water quality)
- **Layer**: Sampling depth (surface, bottom, 0.5m, 1m, 1.5m for core stations)
- **Indicator**: Metrics to measure (pH, DO, COD, heavy metals, etc.)
- **DataRecord**: Actual measured values with status (filled/missing)

### Key Modules

| File | Purpose |
|------|---------|
| `src/stores/task.js` | Pinia store - single source of truth for all task data |
| `src/utils/validation.js` | Core validation logic: `validateTask()`, `getMissingItems()`, `getCompletionRate()` |
| `src/utils/mockData.js` | Mock data generator based on task document, `generateDataEntryMatrix()` |
| `src/types/index.js` | Type enums and constants (SubTaskType, LayerType, RecordStatus, etc.) |
| `src/utils/storage.js` | localStorage wrapper with `taskflow_` prefix |

### Store Structure (Pinia)

The store maintains normalized data:
```js
{
  task: { id, taskCode, name, startTime, endTime },
  subTasks: [],           // Array of subTask objects
  stations: {},           // { subTaskId: stations[] }
  dataRecords: {},       // { subTaskId: DataRecord[] }
  indicators: []
}
```

### Business Rules (in validation.js)

1. **Dredged Mud Core Stations** (HD1, HD8, HD14): Must have 4 layers each (surface, 0.5m, 1m, 1.5m)
2. **Water Quality Depth Rule**: Depth > 10m requires both surface + bottom layer; depth ≤ 10m requires only surface

### Views

- `/tasks` - TaskList.vue: Overview with completion rates per sub-task
- `/data-entry/:subTaskId?` - DataEntry.vue: Excel-like data entry table with filtering
- `/progress` - Progress.vue: Statistics with missing items analysis by station and by indicator

## Future API Integration Points

When connecting to a backend:

1. **`src/stores/task.js` - `initialize()`**: Replace localStorage load with API call
2. **`src/stores/task.js` - `saveData()`**: Replace localStorage save with API POST
3. **`src/utils/storage.js`**: Can be replaced entirely with API-based data fetching

## Package Manager

This project uses **pnpm** (not npm or yarn). All commands must use `pnpm`.
