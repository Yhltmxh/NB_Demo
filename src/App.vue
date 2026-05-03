<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from './stores/task'
import { useThemeStore } from './stores/theme'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const themeStore = useThemeStore()

const isCollapse = ref(false)
const isFullscreen = ref(false)

const currentUser = ref({
  name: '管理员'
})

const menuItems = [
  { path: '/tasks', title: '任务管理', icon: 'Folder' },
  { path: '/templates', title: '模板管理', icon: 'Grid' }
]

onMounted(() => {
  taskStore.initialize()
  themeStore.initialize()
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

function handleMenuSelect(index) {
  router.push(index)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}
</script>

<template>
  <el-container class="app-container">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">环境监测系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-icon class="theme-toggle" @click="themeStore.toggleTheme()">
            <Moon v-if="!themeStore.isDark" />
            <Sunny v-else />
          </el-icon>
          <el-icon class="theme-toggle" @click="toggleFullscreen">
            <FullScreen v-if="!isFullscreen" />
            <Aim v-else />
          </el-icon>
          <el-icon :size="20"><User /></el-icon>
          <span class="username">{{ currentUser.name }}</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--sidebar-border);
  padding: 8px 0;
}

.sidebar-menu {
  border-right: none;
  background-color: var(--sidebar-bg);
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.sidebar-menu .el-menu-item {
  color: var(--sidebar-text);
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-menu-item.is-active {
  background-color: var(--sidebar-active-bg);
  color: var(--el-color-primary);
}

.header {
  background-color: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px 0 20px;
  box-shadow: 0 1px 4px var(--header-shadow);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--el-text-color-regular);
}

.collapse-btn:hover {
  color: var(--el-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.theme-toggle {
  font-size: 20px;
  cursor: pointer;
  color: var(--el-text-color-regular);
}

.theme-toggle:hover {
  color: var(--el-color-primary);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.main-content {
  background-color: var(--main-bg);
  padding: 20px;
  max-width: 100%;
}
</style>
