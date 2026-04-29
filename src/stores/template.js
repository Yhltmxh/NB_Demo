/**
 * 子任务模板 Store
 * 管理模板的 CRUD 操作和 localStorage 持久化
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '../utils/storage'

const TEMPLATE_STORAGE_KEY = 'sub_task_templates'

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now()

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_water',
    name: '水质',
    code: 'water',
    description: '海洋水质监测指标，包含水温、盐度、pH、溶解氧等',
    enabled: true,
    indicators: [
      { id: 'wq_01', name: '水温', category: 'water_quality', unit: '°C' },
      { id: 'wq_02', name: '盐度', category: 'water_quality', unit: '' },
      { id: 'wq_03', name: 'pH', category: 'water_quality', unit: '' },
      { id: 'wq_04', name: '溶解氧', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_05', name: 'COD', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_06', name: '氨氮', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_07', name: '硝酸盐', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_08', name: '亚硝酸盐', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_09', name: '活性磷酸盐', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_10', name: '悬浮物', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_11', name: '石油类', category: 'water_quality', unit: 'mg/L' },
      { id: 'wq_12', name: '铜(Cu)', category: 'water_quality', unit: 'ug/L' },
      { id: 'wq_13', name: '铅(Pb)', category: 'water_quality', unit: 'ug/L' },
      { id: 'wq_14', name: '锌(Zn)', category: 'water_quality', unit: 'ug/L' },
      { id: 'wq_15', name: '镉(Cd)', category: 'water_quality', unit: 'ug/L' }
    ]
  },
  {
    id: 'tpl_sediment',
    name: '沉积物',
    code: 'sediment',
    description: '海洋沉积物监测指标，包含有机碳、硫化物、重金属等',
    enabled: true,
    indicators: [
      { id: 'sed_01', name: '有机碳', category: 'sediment', unit: '%' },
      { id: 'sed_02', name: '硫化物', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_03', name: '石油类', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_04', name: '锌(Zn)', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_05', name: '铅(Pb)', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_06', name: '铜(Cu)', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_07', name: '镉(Cd)', category: 'sediment', unit: 'mg/kg' },
      { id: 'sed_08', name: '粒度', category: 'sediment', unit: '' }
    ]
  },
  {
    id: 'tpl_biology',
    name: '生物',
    code: 'biology',
    description: '海洋生物监测指标，包含叶绿素a、浮游生物、底栖生物等',
    enabled: true,
    indicators: [
      { id: 'bio_01', name: '叶绿素a', category: 'biology', unit: 'mg/m3' },
      { id: 'bio_02', name: '浮游植物', category: 'biology', unit: '种' },
      { id: 'bio_03', name: '浮游动物', category: 'biology', unit: '种' },
      { id: 'bio_04', name: '底栖生物-种类', category: 'biology', unit: '种' },
      { id: 'bio_05', name: '底栖生物-密度', category: 'biology', unit: 'ind/m2' },
      { id: 'bio_06', name: '底栖生物-生物量', category: 'biology', unit: 'g/m2' }
    ]
  },
  {
    id: 'tpl_fishery',
    name: '渔业资源',
    code: 'fishery',
    description: '渔业资源调查指标，包含渔获物种类、资源密度等',
    enabled: true,
    indicators: [
      { id: 'fis_01', name: '渔获物种类', category: 'fishery', unit: '种' },
      { id: 'fis_02', name: '渔获物重量', category: 'fishery', unit: 'kg' },
      { id: 'fis_03', name: '资源密度', category: 'fishery', unit: 'kg/km2' },
      { id: 'fis_04', name: '优势种', category: 'fishery', unit: '' },
      { id: 'fis_05', name: '幼鱼比例', category: 'fishery', unit: '%' }
    ]
  },
  {
    id: 'tpl_environment',
    name: '环境监视',
    code: 'environment',
    description: '海洋环境监视指标，包含水文气象、地形地貌等',
    enabled: true,
    indicators: [
      { id: 'env_01', name: '风速', category: 'environment', unit: 'm/s' },
      { id: 'env_02', name: '风向', category: 'environment', unit: '°' },
      { id: 'env_03', name: '气温', category: 'environment', unit: '°C' },
      { id: 'env_04', name: '气压', category: 'environment', unit: 'hPa' },
      { id: 'env_05', name: '海况', category: 'environment', unit: '级' },
      { id: 'env_06', name: '透明度', category: 'environment', unit: 'm' },
      { id: 'env_07', name: '水深', category: 'environment', unit: 'm' }
    ]
  },
  {
    id: 'tpl_intertidal',
    name: '潮间带',
    code: 'intertidal',
    description: '潮间带生物调查指标',
    enabled: true,
    indicators: [
      { id: 'int_01', name: '潮间带生物种类', category: 'intertidal', unit: '种' },
      { id: 'int_02', name: '潮间带生物密度', category: 'intertidal', unit: 'ind/m2' },
      { id: 'int_03', name: '潮间带生物生物量', category: 'intertidal', unit: 'g/m2' },
      { id: 'int_04', name: '栖息密度', category: 'intertidal', unit: 'ind/m2' }
    ]
  }
]

export const useTemplateStore = defineStore('template', () => {
  const templates = ref([])

  function initialize() {
    const saved = storage.get(TEMPLATE_STORAGE_KEY)
    if (saved && saved.length > 0) {
      templates.value = saved
    } else {
      templates.value = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES))
      saveTemplates()
    }
  }

  function saveTemplates() {
    storage.set(TEMPLATE_STORAGE_KEY, templates.value)
  }

  const enabledTemplates = computed(() => {
    return templates.value.filter(t => t.enabled)
  })

  function getTemplateById(templateId) {
    return templates.value.find(t => t.id === templateId)
  }

  function getTemplateByCode(code) {
    return templates.value.find(t => t.code === code)
  }

  function getTemplateIndicators(templateId) {
    const template = getTemplateById(templateId)
    return template ? template.indicators : []
  }

  function createTemplate(templateData) {
    const newTemplate = {
      id: generateId(),
      name: templateData.name,
      code: templateData.code,
      description: templateData.description || '',
      enabled: templateData.enabled !== undefined ? templateData.enabled : true,
      indicators: templateData.indicators || []
    }
    templates.value.push(newTemplate)
    saveTemplates()
    return newTemplate
  }

  function updateTemplate(templateId, templateData) {
    const index = templates.value.findIndex(t => t.id === templateId)
    if (index !== -1) {
      templates.value[index] = {
        ...templates.value[index],
        name: templateData.name,
        code: templateData.code,
        description: templateData.description,
        enabled: templateData.enabled,
        indicators: templateData.indicators
      }
      saveTemplates()
      return { success: true }
    }
    return { success: false, message: '模板不存在' }
  }

  function deleteTemplate(templateId) {
    const index = templates.value.findIndex(t => t.id === templateId)
    if (index !== -1) {
      templates.value.splice(index, 1)
      saveTemplates()
      return { success: true }
    }
    return { success: false, message: '模板不存在' }
  }

  function toggleTemplateEnabled(templateId) {
    const template = getTemplateById(templateId)
    if (template) {
      template.enabled = !template.enabled
      saveTemplates()
      return { success: true }
    }
    return { success: false, message: '模板不存在' }
  }

  function resetToDefault() {
    templates.value = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES))
    saveTemplates()
  }

  return {
    templates,
    enabledTemplates,
    initialize,
    getTemplateById,
    getTemplateByCode,
    getTemplateIndicators,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateEnabled,
    resetToDefault
  }
})
