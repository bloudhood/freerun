<template>
  <div>
    <header ref="headerRef" class="fixed top-3 left-0 right-0 z-[999] flex justify-center pointer-events-none">
      <div class="card-glass max-w-[380px] w-[calc(100%-32px)] pointer-events-auto overflow-hidden" style="border-radius: var(--radius-lg)"
        :style="messageVisible ? { background: msgBg } : {}"
        :class="{ 'opacity-0 scale-95 pointer-events-none': props.notifyOnly && !messageVisible }">
        
        <transition mode="out-in" enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-120 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          
          <div v-if="messageVisible" key="msg" class="flex items-center gap-3 px-4 py-3">
            <svg class="w-5 h-5 shrink-0" :style="{ color: msgColor }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="msgIcon"></svg>
            <span class="t-callout text-primary">{{ messageContent }}</span>
          </div>
          
          <div v-else-if="!props.notifyOnly" key="default" class="flex items-center h-12 px-4">
            <div class="flex-1 min-w-0 flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: var(--accent-gradient); box-shadow: 0 2px 6px var(--accent-glow)">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span class="t-callout font-medium text-primary truncate">{{ welcomeText }}</span>
            </div>
            <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-tertiary transition-colors hover:text-primary" @click="themeStore.toggle()" aria-label="切换主题">
              <svg v-if="isDark" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
              <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
          </div>
          
          <div v-else key="empty" class="w-full h-12"></div>
        </transition>
      </div>
    </header>
    <ConfirmDialog ref="confirmDialogRef" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { useDataStore } from '@/composables/useDataStore';
import { useThemeStore } from '@/composables/useTheme';

const props = defineProps({ scrolled: { type: Boolean, default: false }, showGithub: { type: Boolean, default: true }, notifyOnly: { type: Boolean, default: false } });
const emit = defineEmits(['logout']);
const headerRef = ref(null); const confirmDialogRef = ref(null);
const themeStore = useThemeStore(); const isDark = computed(() => themeStore.isDark);
const { userInfo, clearAllData } = useDataStore();
const messageVisible = ref(false); const messageContent = ref(''); const messageType = ref('info');
let messageTimer = null;

const msgColors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)' };
const msgBgs   = { success: 'var(--green-soft)', error: 'var(--red-soft)', info: 'var(--blue-soft)' };
const msgIcons = {
  success: '<circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>',
  error:   '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
};
const msgColor = computed(() => msgColors[messageType.value] || msgColors.info);
const msgBg    = computed(() => msgBgs[messageType.value]   || msgBgs.info);
const msgIcon  = computed(() => msgIcons[messageType.value]  || msgIcons.info);

const displayName = computed(() => { const n = userInfo.value?.studentName; return (typeof n === 'string' && n.trim()) ? n.trim() : '同学'; });
const welcomeText = computed(() => `Hi，${displayName.value}`);

const show = (message, type = 'info') => {
  const m = typeof message === 'string' ? message : String(message ?? ''); if (!m) return;
  messageType.value = msgColors[type] ? type : 'info'; messageContent.value = m; messageVisible.value = true;
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { messageVisible.value = false; }, 2800);
};
onUnmounted(() => { if (messageTimer) clearTimeout(messageTimer); });
defineExpose({ show });
</script>
