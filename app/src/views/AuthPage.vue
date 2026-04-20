<template>
  <div
    class="auth-page h-full min-h-0 w-full flex flex-col justify-center items-center relative px-4 pt-14 theme-text-primary animate-fade-in"
  >
    <AppHeader ref="appHeaderRef" :show-github="false" />

    <div class="w-full max-w-[420px] corner-apple glass-apple animate-slide-up relative z-10">
      <div class="mb-10 text-center flex flex-col items-center">
        <!-- Logo Mark -->
        <div class="w-14 h-14 rounded-[18px] bg-anthropic-orange/10 dark:bg-anthropic-orange/20 flex items-center justify-center mb-5 shadow-inner">
          <i class="ri-leaf-line text-2xl text-anthropic-orange"></i>
        </div>
        <h1 class="text-2xl font-heading font-medium text-anthropic-dark dark:text-anthropic-light tracking-tight mb-2">
          Byerun Web
        </h1>
      </div>
      <form @submit.prevent="handleSubmit" @focusout="handleInputBlur" class="space-y-5">
        <div>
          <label class="block text-xs font-semibold mb-2 theme-text-secondary uppercase tracking-wider">手机号</label>
          <div class="relative group">
            <i
              class="ri-smartphone-line absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary pointer-events-none transition-colors group-focus-within:text-anthropic-orange"
            ></i>
            <input
              v-model="phone"
              placeholder="请输入手机号"
              required
              @blur="handleInputBlur"
              class="input-apple block w-full p-3 pl-11 text-sm rounded-xl placeholder:text-sm theme-text-primary"
            />
          </div>
        </div>
        <div v-if="mode === 'reset'">
          <label class="block text-xs font-semibold mb-2 theme-text-secondary uppercase tracking-wider">新密码</label>
          <div class="relative group">
            <i
              class="ri-lock-2-line absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary pointer-events-none transition-colors group-focus-within:text-anthropic-orange"
            ></i>
            <input
              v-model="password"
              type="password"
              placeholder="请设置新密码"
              required
              @blur="handleInputBlur"
              class="input-apple block w-full p-3 pl-11 text-sm rounded-xl placeholder:text-sm theme-text-primary"
            />
          </div>
        </div>
        <div v-if="mode === 'reset'">
          <label class="block text-xs font-semibold mb-2 theme-text-secondary uppercase tracking-wider">验证码</label>
          <div class="flex gap-3">
            <div class="relative flex-1 group">
              <i
                class="ri-key-2-line absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary pointer-events-none transition-colors group-focus-within:text-anthropic-orange"
              ></i>
              <input
                v-model="code"
                placeholder="请输入短信验证码"
                required
                @blur="handleInputBlur"
                class="input-apple w-full p-3 pl-11 text-sm rounded-xl placeholder:text-sm theme-text-primary"
              />
            </div>
            <button
              type="button"
              @click="sendCode"
              :disabled="sending"
              class="btn-apple px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap bg-anthropic-dark dark:bg-anthropic-light text-anthropic-light dark:text-anthropic-dark"
            >
              <span v-if="!sending">发送验证码</span>
              <div
                v-else
                class="w-4 h-4 border-2 border-current/30 rounded-full border-t-current animate-spin"
              ></div>
            </button>
          </div>
        </div>
        <div v-if="mode === 'login'">
          <label class="block text-xs font-semibold mb-2 theme-text-secondary uppercase tracking-wider">密码</label>
          <div class="relative group">
            <i
              class="ri-lock-2-line absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary pointer-events-none transition-colors group-focus-within:text-anthropic-orange"
            ></i>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              required
              @blur="handleInputBlur"
              class="input-apple block w-full p-3 pl-11 text-sm rounded-xl placeholder:text-sm theme-text-primary"
            />
          </div>
        </div>
        <div class="flex items-center justify-between mt-2 mb-6">
          <label v-if="mode === 'login'" class="flex items-center space-x-2 cursor-pointer group">
            <input type="checkbox" v-model="rememberMe" class="hidden" />
            <div
              class="w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-300 auth-remember-box"
              :class="rememberMe ? 'bg-anthropic-orange border-anthropic-orange' : 'border-anthropic-mid-gray/50'"
            >
              <i v-if="rememberMe" class="ri-check-line text-xs text-white scale-in-center"></i>
            </div>
            <span class="text-xs font-medium theme-text-secondary group-hover:text-anthropic-dark dark:group-hover:text-anthropic-light transition-colors">记住我</span>
          </label>
          <a
            v-if="mode === 'login'"
            href="#"
            @click.prevent="mode = 'reset'"
            class="text-xs font-medium text-anthropic-orange hover:text-anthropic-dark dark:hover:text-anthropic-light transition-colors ml-auto"
            >忘记密码？</a
          >
        </div>
        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="btn-apple w-full font-heading font-medium text-base rounded-2xl py-3.5 bg-anthropic-orange text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span v-if="!loading">{{ mode === 'login' ? '立即登录' : '重置密码' }}</span>
            <div
              v-else
              class="w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin mx-auto"
            ></div>
          </button>
        </div>
        <div v-if="mode === 'reset'" class="text-center mt-6">
          <a href="#" @click.prevent="mode = 'login'" class="text-sm font-medium text-anthropic-mid-gray hover:text-anthropic-dark dark:hover:text-anthropic-light transition-colors">返回登录</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
import { api } from '@/sdk/app';
import { useDataStore } from '@/composables/useDataStore';

const rootShowMessage = inject('showMessage', null);
const { userInfo, fetchUserData, rememberLogin, savedPhone } = useDataStore();
const router = useRouter();
const appHeaderRef = ref(null);

const mode = ref('login');
const phone = ref('');
const password = ref('');
const code = ref('');
const rememberMe = ref(!!rememberLogin.value);
const loading = ref(false);
const sending = ref(false);
const keyboardInset = ref(0);
const viewportBaseHeight = ref(0);
let keyboardWasVisible = false;
let keyboardMeasureTimer = 0;

function showMessage(message, type = 'info') {
  if (appHeaderRef.value?.show) {
    appHeaderRef.value.show(message, type);
    return;
  }

  if (typeof rootShowMessage === 'function') {
    rootShowMessage(message, type);
  }
}

function restoreViewportPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function getViewportBaseHeight() {
  const cssHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--app-vh'),
  );
  if (Number.isFinite(cssHeight) && cssHeight > 0) return cssHeight;
  return window.innerHeight || document.documentElement?.clientHeight || 0;
}

function syncViewportBaseHeight() {
  viewportBaseHeight.value = getViewportBaseHeight();
}

function measureKeyboardInset() {
  const viewport = window.visualViewport;
  const layoutHeight = viewportBaseHeight.value || getViewportBaseHeight();
  const visibleHeight = Math.max(0, viewport?.height || layoutHeight);
  const offsetTop = Math.max(0, viewport?.offsetTop || 0);
  const inset = Math.max(0, layoutHeight - (visibleHeight + offsetTop));
  keyboardInset.value = inset;

  if (keyboardWasVisible && inset <= 0) {
    restoreViewportPosition();
  }
  keyboardWasVisible = inset > 0;
}

function scheduleKeyboardMeasure() {
  if (keyboardMeasureTimer) clearTimeout(keyboardMeasureTimer);
  keyboardMeasureTimer = window.setTimeout(() => {
    syncViewportBaseHeight();
    measureKeyboardInset();
    keyboardMeasureTimer = 0;
  }, 60);
}

function handleInputBlur() {
  window.setTimeout(() => {
    syncViewportBaseHeight();
    measureKeyboardInset();
    if (keyboardInset.value <= 0) {
      restoreViewportPosition();
    }
  }, 120);
}

onMounted(() => {
  if (rememberMe.value) {
    phone.value = savedPhone.value || '';
  }
  syncViewportBaseHeight();
  measureKeyboardInset();
  window.addEventListener('resize', scheduleKeyboardMeasure);
  window.addEventListener('orientationchange', scheduleKeyboardMeasure);
  window.visualViewport?.addEventListener('resize', scheduleKeyboardMeasure);
  window.visualViewport?.addEventListener('scroll', scheduleKeyboardMeasure);
});

onUnmounted(() => {
  if (keyboardMeasureTimer) {
    clearTimeout(keyboardMeasureTimer);
    keyboardMeasureTimer = 0;
  }
  window.removeEventListener('resize', scheduleKeyboardMeasure);
  window.removeEventListener('orientationchange', scheduleKeyboardMeasure);
  window.visualViewport?.removeEventListener('resize', scheduleKeyboardMeasure);
  window.visualViewport?.removeEventListener('scroll', scheduleKeyboardMeasure);
});

watch(rememberMe, (val) => {
  rememberLogin.value = !!val;

  if (!val) {
    savedPhone.value = '';
  }
});

const sendCode = async () => {
  if (!phone.value) {
    showMessage('请输入手机号', 'error');
    return;
  }
  sending.value = true;
  try {
    const { data } = await api.sendVerifyCode(phone.value);
    if (data.code === 10000) {
      showMessage('验证码已发送', 'success');
    } else {
      showMessage(data.msg || '发送失败', 'error');
    }
  } catch (e) {
    showMessage('发送异常', 'error');
  } finally {
    sending.value = false;
  }
};

const handleLogin = async () => {
  loading.value = true;
  try {
    const { data } = await api.login(phone.value, password.value);
    if (data.code === 10000) {
      if (rememberMe.value) {
        savedPhone.value = phone.value;
      } else {
        savedPhone.value = '';
      }
      userInfo.value = data.response;
      try {
        await fetchUserData();
      } catch (e) {}
      router.replace({ name: 'home' }).catch(() => {});
    } else {
      showMessage(data.msg, 'error');
    }
  } catch (e) {
    console.error(e);
    showMessage('登录失败', 'error');
  } finally {
    loading.value = false;
  }
};

const handleReset = async () => {
  if (!code.value) {
    showMessage('请输入验证码', 'error');
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.updatePassword(phone.value, password.value, code.value);
    if (data.code === 10000) {
      showMessage('密码重置成功，请登录', 'success');
      phone.value = '';
      password.value = '';
      code.value = '';
      mode.value = 'login';
    } else {
      showMessage(data.msg || '重置失败', 'error');
    }
  } catch (e) {
    showMessage('重置异常', 'error');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = () => {
  if (mode.value === 'login') {
    handleLogin();
  } else {
    handleReset();
  }
};
</script>

<style scoped>
.auth-remember-box {
  border-color: var(--card-divider);
}

.auth-remember-box.is-checked {
  background-color: var(--button-primary-bg);
  border-color: var(--button-primary-bg);
}
</style>
