<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplateStore } from '../stores/template'
import { AvailableIndicators } from '../types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const templateStore = useTemplateStore()

const templateId = computed(() => route.params.id)
const isEdit = computed(() => !!templateId.value)

const formData = ref({
  name: '',
  code: '',
  description: '',
  enabled: true,
  indicators: []
})

const formRef = ref(null)

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '编码只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

const availableIndicatorsByCategory = computed(() => {
  const categories = {}
  AvailableIndicators.forEach(ind => {
    if (!categories[ind.category]) {
      categories[ind.category] = []
    }
    categories[ind.category].push(ind)
  })
  return categories
})

function isIndicatorSelected(indicatorId) {
  return formData.value.indicators.some(i => i.id === indicatorId)
}

function toggleIndicator(indicator) {
  const index = formData.value.indicators.findIndex(i => i.id === indicator.id)
  if (index > -1) {
    formData.value.indicators.splice(index, 1)
  } else {
    formData.value.indicators.push({ ...indicator })
  }
}

function selectAllInCategory(category) {
  AvailableIndicators.filter(i => i.category === category).forEach(ind => {
    if (!isIndicatorSelected(ind.id)) {
      formData.value.indicators.push({ ...ind })
    }
  })
}

function deselectAllInCategory(category) {
  formData.value.indicators = formData.value.indicators.filter(i => i.category !== category)
}

onMounted(() => {
  templateStore.initialize()
  if (isEdit.value) {
    const template = templateStore.getTemplateById(templateId.value)
    if (template) {
      formData.value = {
        name: template.name,
        code: template.code,
        description: template.description,
        enabled: template.enabled,
        indicators: [...template.indicators]
      }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value.validate()

    if (formData.value.indicators.length === 0) {
      ElMessage.warning('请至少选择一个指标')
      return
    }

    if (isEdit.value) {
      templateStore.updateTemplate(templateId.value, formData.value)
      ElMessage.success('更新成功')
    } else {
      templateStore.createTemplate(formData.value)
      ElMessage.success('创建成功')
    }

    router.push('/templates')
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

function handleCancel() {
  router.push('/templates')
}
</script>

<template>
  <div class="template-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button size="small" @click="handleCancel">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>{{ isEdit ? '编辑模板' : '新建模板' }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：水质、沉积物、生物" />
        </el-form-item>

        <el-form-item label="模板编码" prop="code">
          <el-input v-model="formData.code" placeholder="如：water、sediment、biology" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="模板描述（可选）" />
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="formData.enabled" />
        </el-form-item>

        <el-form-item label="指标配置">
          <div class="indicators-config">
            <div v-for="(indicators, category) in availableIndicatorsByCategory" :key="category" class="category-group">
              <div class="category-header">
                <span class="category-name">{{ category }}</span>
                <el-button size="small" text @click="selectAllInCategory(category)">全选</el-button>
                <el-button size="small" text @click="deselectAllInCategory(category)">取消</el-button>
              </div>
              <div class="category-indicators">
                <el-checkbox
                  v-for="ind in indicators"
                  :key="ind.id"
                  :model-value="isIndicatorSelected(ind.id)"
                  @change="() => toggleIndicator(ind)"
                  :label="ind.name"
                >
                  {{ ind.name }}
                  <span v-if="ind.unit" class="indicator-unit">({{ ind.unit }})</span>
                </el-checkbox>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="已选指标">
          <div class="selected-indicators">
            <el-tag
              v-for="ind in formData.indicators"
              :key="ind.id"
              closable
              size="small"
              style="margin-right: 8px; margin-bottom: 4px"
              @close="toggleIndicator(ind)"
            >
              {{ ind.name }}
              <span v-if="ind.unit" style="color: #909399">({{ ind.unit }})</span>
            </el-tag>
            <span v-if="formData.indicators.length === 0" class="no-data">未选择任何指标</span>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.template-create {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indicators-config {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.category-group {
  margin-bottom: 20px;
}

.category-group:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ebeef5;
}

.category-name {
  font-weight: 600;
  color: #303133;
  margin-right: 10px;
  text-transform: uppercase;
}

.category-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.indicator-unit {
  color: #909399;
  font-size: 12px;
}

.selected-indicators {
  min-height: 60px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.no-data {
  color: #909399;
  font-size: 14px;
}
</style>
