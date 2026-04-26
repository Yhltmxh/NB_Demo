<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { Frequency, FrequencyName, SubTaskType, SubTaskTypeName, FIXED_SUB_TASK_TYPES } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const taskId = computed(() => route.params.id)
const task = computed(() => taskStore.getTaskById(taskId.value))

// 表单数据
const formData = ref({
  taskCode: '',
  name: '',
  startTime: '',
  endTime: '',
  frequency: Frequency.ONCE,
  description: '',
  creator: '',
  monitoringConfig: {
    stations: []
  }
})

// 表单验证
const formRef = ref(null)
const formRules = {
  taskCode: [
    { required: true, message: '请输入任务编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  frequency: [
    { required: true, message: '请选择监测频次', trigger: 'change' }
  ]
}

// 频次选项
const frequencyOptions = Object.entries(FrequencyName).map(([value, label]) => ({
  value,
  label
}))

// 子任务类型选项（固定3个）
const subTaskTypeOptions = FIXED_SUB_TASK_TYPES.map(type => ({
  value: type,
  label: SubTaskTypeName[type]
}))

// 新增站位
const newStation = ref({
  code: '',
  name: '',
  subTaskTypes: []
})

// 加载任务数据
onMounted(() => {
  if (task.value) {
    formData.value = JSON.parse(JSON.stringify(task.value))
  }
})

// 添加站位
function addStation() {
  if (!newStation.value.code || !newStation.value.name) {
    ElMessage.warning('请填写站位编号和名称')
    return
  }

  if (newStation.value.subTaskTypes.length === 0) {
    ElMessage.warning('请至少选择一个子任务类型')
    return
  }

  formData.value.monitoringConfig.stations.push({
    ...newStation.value,
    subTaskTypes: [...newStation.value.subTaskTypes]
  })

  newStation.value = { code: '', name: '', subTaskTypes: [] }
}

// 删除站位
function removeStation(index) {
  formData.value.monitoringConfig.stations.splice(index, 1)
}

// 站点选择子任务类型
function toggleStationSubTaskType(stationIndex, subTaskType) {
  const station = formData.value.monitoringConfig.stations[stationIndex]
  const index = station.subTaskTypes.indexOf(subTaskType)
  if (index > -1) {
    station.subTaskTypes.splice(index, 1)
  } else {
    station.subTaskTypes.push(subTaskType)
  }
}

// 检查站点是否选择了某子任务类型
function isStationHasSubTaskType(stationIndex, subTaskType) {
  return formData.value.monitoringConfig.stations[stationIndex].subTaskTypes.includes(subTaskType)
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()

    if (formData.value.monitoringConfig.stations.length === 0) {
      ElMessage.warning('请至少添加一个站位')
      return
    }

    const hasSelected = formData.value.monitoringConfig.stations.some(s => s.subTaskTypes.length > 0)
    if (!hasSelected) {
      ElMessage.warning('请至少为一个站位选择子任务类型')
      return
    }

    const result = taskStore.updateTask(taskId.value, formData.value)

    if (result.success) {
      ElMessage.success('任务更新成功')
      router.push('/tasks')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 取消
function handleCancel() {
  router.push(`/tasks/${taskId.value}`)
}
</script>

<template>
  <div class="task-edit">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>编辑任务</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="task-form"
      >
        <!-- 基础信息 -->
        <div class="form-section">
          <h3 class="section-title">基础信息</h3>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="任务编号" prop="taskCode">
                <el-input v-model="formData.taskCode" placeholder="如 HJ-2024-004" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="任务名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入任务名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="formData.startTime"
                  type="date"
                  placeholder="选择开始时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间" prop="endTime">
                <el-date-picker
                  v-model="formData.endTime"
                  type="date"
                  placeholder="选择结束时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="监测频次" prop="frequency">
                <el-select v-model="formData.frequency" placeholder="选择监测频次" style="width: 100%">
                  <el-option
                    v-for="option in frequencyOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建人">
                <el-input v-model="formData.creator" placeholder="创建人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="任务描述">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入任务描述（可选）"
            />
          </el-form-item>
        </div>

        <!-- 站点配置 -->
        <div class="form-section">
          <h3 class="section-title">站点配置</h3>
          <p class="section-hint">每个站点可选择执行哪些子任务（勾选表示该站点需要执行该子任务）</p>

          <!-- 站位表格 -->
          <el-table
            :data="formData.monitoringConfig.stations"
            border
            stripe
            style="margin-bottom: 20px"
            v-if="formData.monitoringConfig.stations.length > 0"
          >
            <el-table-column prop="code" label="站位编号" width="120" />
            <el-table-column prop="name" label="站位名称" width="150" />
            <el-table-column
              v-for="typeOption in subTaskTypeOptions"
              :key="typeOption.value"
              :label="typeOption.label"
              width="120"
              align="center"
            >
              <template #default="{ $index }">
                <el-checkbox
                  :model-value="isStationHasSubTaskType($index, typeOption.value)"
                  @change="(checked) => toggleStationSubTaskType($index, typeOption.value, checked)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" size="small" text @click="removeStation($index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 表头说明 -->
          <div class="station-table-header" v-if="formData.monitoringConfig.stations.length > 0">
            <span class="header-label">勾选表示该站点需要执行该子任务</span>
          </div>

          <!-- 添加站位表单 -->
          <div class="add-station-form">
            <el-row :gutter="15" align="middle">
              <el-col :span="4">
                <el-input v-model="newStation.code" placeholder="站位编号" />
              </el-col>
              <el-col :span="4">
                <el-input v-model="newStation.name" placeholder="站位名称" />
              </el-col>
              <el-col :span="12">
                <el-checkbox-group v-model="newStation.subTaskTypes">
                  <el-checkbox
                    v-for="typeOption in subTaskTypeOptions"
                    :key="typeOption.value"
                    :value="typeOption.value"
                    :label="typeOption.label"
                  />
                </el-checkbox-group>
              </el-col>
              <el-col :span="4">
                <el-button type="primary" @click="addStation">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            保存修改
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.task-edit {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.task-form {
  max-width: 700px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 15px;
}

.station-table-header {
  margin-bottom: 10px;
}

.header-label {
  font-size: 12px;
  color: #909399;
}

.add-station-form {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>