/**
 * Vue Router 配置
 */
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/tasks'
  },
  {
    path: '/tasks',
    name: 'TaskList',
    component: () => import('../views/TaskList.vue'),
    meta: { title: '任务管理' }
  },
  {
    path: '/data-entry/:subTaskId?',
    name: 'DataEntry',
    component: () => import('../views/DataEntry.vue'),
    meta: { title: '数据录入' }
  },
  {
    path: '/progress',
    name: 'Progress',
    component: () => import('../views/Progress.vue'),
    meta: { title: '进度统计' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
