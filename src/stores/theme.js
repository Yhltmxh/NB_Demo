import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function initialize() {
    const saved = localStorage.getItem('taskflow_dark_mode')
    if (saved === 'true') {
      isDark.value = true
      document.documentElement.classList.add('dark')
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('taskflow_dark_mode', String(isDark.value))
  }

  return { isDark, initialize, toggleTheme }
})
