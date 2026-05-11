<template>
  <div :class="['app anthropic-canvas text-text-primary transition-colors duration-280 relative font-body', { 'dark': isDark }]">
    <!-- Main Content -->
    <div class="app-content relative z-10 w-full h-full max-w-full lg:max-w-[600px] mx-auto shadow-none sm:shadow-sm">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { useThemeStore } from './composables/useTheme';

const themeStore = useThemeStore();

const setViewportHeightVar = () => {
  const height = window.innerHeight || document.documentElement?.clientHeight || 0;
  document.documentElement.style.setProperty('--app-vh', `${Math.max(0, Math.round(height))}px`);
};

onMounted(() => {
  setViewportHeightVar();
  window.addEventListener('resize', setViewportHeightVar);
  window.addEventListener('orientationchange', setViewportHeightVar);
});

onUnmounted(() => {
  window.removeEventListener('resize', setViewportHeightVar);
  window.removeEventListener('orientationchange', setViewportHeightVar);
});

const isDark = computed(() => themeStore.isDark);
</script>

<style scoped>
.app {
  height: var(--app-vh, 100dvh);
  min-height: var(--app-vh, 100dvh);
  max-height: var(--app-vh, 100dvh);
  width: 100%;
  margin: 0 auto;
}

.app-content {
  height: 100%;
  min-height: 0;
}
</style>
