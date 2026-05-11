<template>
  <div>
    <header
      ref="headerRef"
      class="fixed top-3 left-0 right-0 z-[999] flex justify-center pointer-events-none"
    >
      <div
        class="glass rounded-2xl max-w-[400px] w-[calc(100%-32px)] pointer-events-auto overflow-hidden"
        :class="{
          'opacity-0 scale-95 pointer-events-none': props.notifyOnly && !messageVisible
        }"
        :style="{
          background: messageVisible ? messageStyles[messageType].bg : undefined,
          borderColor: messageVisible ? messageStyles[messageType].border : undefined,
          transition: 'all 0.25s var(--ease-default)'
        }"
      >
        <transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <!-- Message -->
          <div v-if="messageVisible" key="message" class="flex items-center w-full px-4 py-3 gap-3">
            <svg class="w-5 h-5 shrink-0" :style="{ color: messageStyles[messageType].iconColor }" 
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle v-if="messageType === 'success'" cx="12" cy="12" r="10"/>
              <polyline v-if="messageType === 'success'" points="16 12 12 8 8 12"/>
              <line v-if="messageType === 'success'" x1="12" y1="16" x2="12" y2="8"/>
              
              <circle v-if="messageType === 'error'" cx="12" cy="12" r="10"/>
              <line v-if="messageType === 'error'" x1="15" y1="9" x2="9" y2="15"/>
              <line v-if="messageType === 'error'" x1="9" y1="9" x2="15" y2="15"/>
              
              <circle v-if="messageType === 'info'" cx="12" cy="12" r="10"/>
              <line v-if="messageType === 'info'" x1="12" y1="16" x2="12" y2="12"/>
              <line v-if="messageType === 'info'" x1="12" y1="8" x2="12.01" y2="8"/>
              
              <path v-if="messageType === 'warning'" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line v-if="messageType === 'warning'" x1="12" y1="9" x2="12" y2="13"/>
              <line v-if="messageType === 'warning'" x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span class="text-callout" :style="{ color: messageStyles[messageType].textColor }">
              {{ messageContent }}
            </span>
          </div>

          <!-- Default -->
          <div v-else-if="!props.notifyOnly" key="default" class="flex items-center w-full h-12 px-4">
            <slot name="content">
              <!-- Welcome Text -->
              <div class="flex-1 min-w-0">
                <transition mode="out-in" name="welcome-fade">
                  <span v-if="welcomePhase === 'text'" key="text" class="text-callout font-medium truncate block"
                        style="color: var(--text-primary)">
                    {{ welcomeText }}
                  </span>
                  <div v-else key="logo" class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg flex items-center justify-center"
                         style="background: linear-gradient(135deg, var(--accent) 0%, #ff8f65 100%)">
                      <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                    </div>
                    <span class="text-callout font-medium" style="color: var(--text-primary)">Byerun</span>
                  </div>
                </transition>
              </div>

              <!-- Theme Toggle -->
              <button
                type="button"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style="color: var(--text-tertiary)"
                @click="themeStore.toggle()"
              >
                <svg v-if="isDark" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </button>
            </slot>
          </div>

          <div v-else key="notify-placeholder" class="w-full h-12"></div>
        </transition>
      </div>
    </header>

    <ConfirmDialog ref="confirmDialogRef" />
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance, watch, onUnmounted } from 'vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { useDataStore } from '@/composables/useDataStore';
import { useThemeStore } from '@/composables/useTheme';

const props = defineProps({
  scrolled: { type: Boolean, default: false },
  showGithub: { type: Boolean, default: true },
  notifyOnly: { type: Boolean, default: false },
});

const emit = defineEmits(['logout']);

const headerRef = ref(null);
const confirmDialogRef = ref(null);
const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);
const { userInfo, clearAllData } = useDataStore();
const welcomePhase = ref('logo');
const hasPlayedWelcome = ref(false);
const timers = [];
const messageVisible = ref(false);
const messageContent = ref('');
const messageType = ref('info');

const messageStyles = {
  success: {
    bg: 'rgba(52, 199, 89, 0.12)',
    border: 'rgba(52, 199, 89, 0.3)',
    iconColor: 'var(--success)',
    textColor: 'var(--text-primary)',
  },
  error: {
    bg: 'rgba(255, 59, 48, 0.12)',
    border: 'rgba(255, 59, 48, 0.3)',
    iconColor: 'var(--destructive)',
    textColor: 'var(--text-primary)',
  },
  info: {
    bg: 'rgba(0, 122, 255, 0.12)',
    border: 'rgba(0, 122, 255, 0.3)',
    iconColor: 'var(--info)',
    textColor: 'var(--text-primary)',
  },
  warning: {
    bg: 'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.3)',
    iconColor: 'var(--warning)',
    textColor: 'var(--text-primary)',
  },
};

let messageTimer = null;

const displayName = computed(() => {
  const name = userInfo.value?.studentName;
  if (typeof name === 'string' && name.trim()) return name.trim();
  return '同学';
});

const welcomeText = computed(() => `Hi，${displayName.value}`);

const clearSequenceTimers = () => {
  while (timers.length) clearTimeout(timers.pop());
};

const startWelcomeSequence = () => {
  clearSequenceTimers();
  welcomePhase.value = 'logo';
  timers.push(setTimeout(() => { welcomePhase.value = 'text'; }, 620));
  timers.push(setTimeout(() => { welcomePhase.value = 'logo'; }, 4000));
};

watch(
  () => userInfo.value?.studentName,
  (name) => {
    if (!hasPlayedWelcome.value && typeof name === 'string' && name.trim()) {
      hasPlayedWelcome.value = true;
      startWelcomeSequence();
    }
  },
  { immediate: true }
);

const handleLogout = async () => {
  const confirmed = await confirmDialogRef.value?.show({
    title: '退出登录',
    message: '确定要退出登录吗？',
  });

  if (confirmed) {
    const instance = getCurrentInstance();
    const hasListener = !!(
      instance?.vnode?.props?.onLogout || instance?.vnode?.props?.onLogout === ''
    );
    if (hasListener) {
      emit('logout');
    } else {
      try { clearAllData(); } catch (e) {}
      window.location.reload();
    }
  }
};

const show = (message, type = 'info') => {
  const normalizedType = messageStyles[type] ? type : 'info';
  const normalizedMessage = typeof message === 'string' ? message : String(message ?? '');
  if (!normalizedMessage) return;

  messageType.value = normalizedType;
  messageContent.value = normalizedMessage;
  messageVisible.value = true;

  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { messageVisible.value = false; }, 3000);
};

const getHeaderElement = () => headerRef.value;

onUnmounted(() => {
  clearSequenceTimers();
  if (messageTimer) clearTimeout(messageTimer);
});

defineExpose({ show, getHeaderElement });
</script>

<style scoped>
.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: all 0.3s var(--ease-default);
}

.welcome-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.welcome-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
