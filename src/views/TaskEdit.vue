<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { Frequency, FrequencyName, DepthType, DepthTypeName, AvailableIndicators } from '../types'
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
    stations: [],
    indicators: [],
    depths: {
      type: DepthType.SURFACE,
      customDepths: []
    }
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

// 深度类型选项
const depthTypeOptions = Object.entries(DepthTypeName).map(([value, label]) => ({
  value,
  label
}))

// 指标选项（按类别分组）
const indicatorOptions = computed(() => {
  const categories = {
    water_quality: { label: '水质指标', children: [] },
    sediment: { label: '沉积物指标', children: [] },
    biology: { label: '生物指标', children: [] }
  }

  AvailableIndicators.forEach(ind => {
    if (categories[ind.category]) {
      categories[ind.category].children.push({
        value: ind.id,
        label: `${ind.name}${ind.unit ? ` (${ind.unit})` : ''}`,
        ...ind
      })
    }
  })

  return Object.values(categories)
})

// 新增站位
const newStation = ref({
  code: '',
  name: '',
  longitude: '',
  latitude: '',
  depth: null
})

// 自定义深度输入
const newCustomDepth = ref('')

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

  formData.value.monitoringConfig.stations.push({
    ...newStation.value
  })

  newStation.value = { code: '', name: '', longitude: '', latitude: '', depth: null }
}

// 删除站位
function removeStation(index) {
  formData.value.monitoringConfig.stations.splice(index, 1)
}

// 添加自定义深度
function addCustomDepth() {
  if (!newCustomDepth.value) {
    ElMessage.warning('请输入深度值')
    return
  }

  if (!formData.value.monitoringConfig.depths.customDepths.includes(newCustomDepth.value)) {
    formData.value.monitoringConfig.depths.customDepths.push(newCustomDepth.value)
  }
  newCustomDepth.value = ''
}

// 删除自定义深度
function removeCustomDepth(index) {
  formData.value.monitoringConfig.depths.customDepths.splice(index, 1)
}

// 深度类型变化
function onDepthTypeChange() {
  if (formData.value.monitoringConfig.depths.type !== DepthType.CUSTOM) {
    formData.value.monitoringConfig.depths.customDepths = []
  }
}

// 指标选择变化
function onIndicatorsChange(values) {
  const selectedIndicators = values.map(id => {
    return AvailableIndicators.find(ind => ind.id === id)
  }).filter(Boolean)

  formData.value.monitoringConfig.indicators = selectedIndicators
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()

    if (formData.value.monitoringConfig.stations.length === 0) {
      ElMessage.warning('请至少添加一个站位')
      return
    }

    if (formData.value.monitoringConfig.indicators.length === 0) {
      ElMessage.warning('请至少选择一个指标')
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

// 获取已选指标列表
const selectedIndicators = computed(() => {
  return formData.value.monitoringConfig.indicators
})
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

        <!-- 监测配置 -->
        <div class="form-section">
          <h3 class="section-title">监测配置</h3>

          <!-- 站位配置 -->
          <div class="config-block">
            <h4 class="block-title">站位配置</h4>

            <el-table
              :data="formData.monitoringConfig.stations"
              border
              stripe
              style="margin-bottom: 15px"
              v-if="formData.monitoringConfig.stations.length > 0"
            >
              <el-table-column prop="code" label="站位编号" width="120" />
              <el-table-column prop="name" label="站位名称" width="150" />
              <el-table-column prop="longitude" label="经度" width="120" />
              <el-table-column prop="latitude" label="纬度" width="120" />
              <el-table-column prop="depth" label="水深(m)" width="100" />
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" text @click="removeStation($index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="add-station-form">
              <el-row :gutter="10">
                <el-col :span="4">
                  <el-input v-model="newStation.code" placeholder="站位编号" />
                </el-col>
                <el-col :span="4">
                  <el-input v-model="newStation.name" placeholder="站位名称" />
                </el-col>
                <el-col :span="4">
                  <el-input v-model="newStation.longitude" placeholder="经度" />
                </el-col>
                <el-col :span="4">
                  <el-input v-model="newStation.latitude" placeholder="纬度" />
                </el-col>
                <el-col :span="4">
                  <el-input-number v-model="newStation.depth" :min="0" placeholder="水深" controls-position="right" />
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

          <!-- 指标配置 -->
          <div class="config-block">
            <h4 class="block-title">指标配置</h4>

            <el-form-item label="选择指标">
              <el-cascader
                v-model="formData.monitoringConfig.indicators"
                :options="indicatorOptions"
                :props="{ multiple: true, label: 'label', value: 'id' }"
                placeholder="请选择监测指标"
                style="width: 100%"
                @change="onIndicatorsChange"
              />
            </el-form-item>

            <div class="selected-indicators" v-if="selectedIndicators.length > 0">
              <el-tag
                v-for="ind in selectedIndicators"
                :key="ind.id"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px"
              >
                {{ ind.name }}
                <span v-if="ind.unit" style="color: #909399">({{ ind.unit }})</span>
              </el-tag>
            </div>
          </div>

          <!-- 深度配置 -->
          <div class="config-block">
            <h4 class="block-title">深度配置</h4>

            <el-form-item label="深度类型">
              <el-radio-group v-model="formData.monitoringConfig.depths.type" @change="onDepthTypeChange">
                <el-radio
                  v-for="option in depthTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="自定义深度" v-if="formData.monitoringConfig.depths.type === DepthType.CUSTOM">
              <div class="custom-depths">
                <el-tag
                  v-for="(depth, index) in formData.monitoringConfig.depths.customDepths"
                  :key="depth"
                  closable
                  size="small"
                  style="margin-right: 8px"
                  @close="removeCustomDepth(index)"
                >
                  {{ depth }}
                </el-tag>
              </div>
              <div class="add-depth-form" style="margin-top: 10px">
                <el-input
                  v-model="newCustomDepth"
                  placeholder="如 0.5m, 1m, 1.5m"
                  style="width: 200px"
                >
                  <template #append>
                    <el-button @click="addCustomDepth">添加</el-button>
                  </template>
                </el-input>
              </div>
            </el-form-item>

            <div class="depth-hint" v-else>
              <el-alert
                :title="formData.monitoringConfig.depths.type === DepthType.SURFACE ? '仅采集表层水样' : '水深>10m时采表层和底层，≤10m时仅采表层'"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
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
  max-width: 800px;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.config-block {
  margin-bottom: 25px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 15px;
}

.add-station-form,
.add-depth-form {
  margin-top: 10px;
}

.selected-indicators {
  margin-top: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  min-height: 40px;
}

.custom-depths {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.depth-hint {
  margin-top: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
