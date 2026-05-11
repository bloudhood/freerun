<template>
  <div class="min-h-full flex flex-col items-center justify-center px-5 py-12 animate-fade-in"
       style="background: var(--bg-primary)">
    
    <!-- Background decoration -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-30"
           style="background: radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)"></div>
      <div class="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20"
           style="background: radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)"></div>
    </div>
    
    <!-- Main content -->
    <div class="relative z-10 w-full max-w-[400px]">
      
      <!-- Logo & Title -->
      <div class="text-center mb-10 animate-slide-up">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
             style="background: linear-gradient(135deg, var(--accent) 0%, #ff8f65 100%); box-shadow: 0 8px 32px rgba(255, 107, 53, 0.3)">
          <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="text-title" style="color: var(--text-primary)">Byerun</h1>
        <p class="text-callout mt-2" style="color: var(--text-secondary)">校园跑步，轻松完成</p>
      </div>
      
      <!-- Login Card -->
      <div class="card p-6 animate-slide-up" style="animation-delay: 100ms">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          
          <!-- Phone Input -->
          <div>
            <label class="block text-caption font-medium mb-2" style="color: var(--text-secondary)">
              手机号
            </label>
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--text-tertiary)">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <input
                v-model="phone"
                type="tel"
                placeholder="请输入手机号"
                required
                class="input-field pl-12"
              />
            </div>
          </div>
          
          <!-- Password Input -->
          <div v-if="mode === 'login'">
            <label class="block text-caption font-medium mb-2" style="color: var(--text-secondary)">
              密码
            </label>
            <div class="relative">
              <div class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--text-tertiary)">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                required
                class="input-field pl-12"
              />
            </div>
          </div>
          
          <!-- Reset Password Fields -->
          <template v-if="mode === 'reset'">
            <div>
              <label class="block text-caption font-medium mb-2" style="color: var(--text-secondary)">
                新密码
              </label>
              <div class="relative">
                <div class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--text-tertiary)">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  v-model="password"
                  type="password"
                  placeholder="请设置新密码"
                  required
                  class="input-field pl-12"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-caption font-medium mb-2" style="color: var(--text-secondary)">
                验证码
              </label>
              <div class="flex gap-3">
                <div class="relative flex-1">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--text-tertiary)">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    v-model="code"
                    placeholder="请输入验证码"
                    required
                    class="input-field pl-12"
                  />
                </div>
                <button
                  type="button"
                  @click="sendCode"
                  :disabled="sending"
                  class="btn btn-ghost whitespace-nowrap"
                  style="background: var(--btn-secondary-bg); color: var(--text-primary)"
                >
                  <span v-if="!sending">发送</span>
                  <div v-else class="spinner"></div>
                </button>
              </div>
            </div>
          </template>
          
          <!-- Options Row -->
          <div v-if="mode === 'login'" class="flex items-center justify-between py-1">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" v-model="rememberMe" class="hidden" />
              <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                   :style="{
                     background: rememberMe ? 'var(--accent)' : 'transparent',
                     borderColor: rememberMe ? 'var(--accent)' : 'var(--separator-opaque)'
                   }">
                <svg v-if="rememberMe" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span class="text-caption" style="color: var(--text-secondary)">记住我</span>
            </label>
            <a href="#" @click.prevent="mode = 'reset'" class="text-caption font-medium" style="color: var(--accent)">
              忘记密码？
            </a>
          </div>
          
          <!-- Submit Button -->
          <div class="pt-2">
            <!-- Proxy Status -->
            <div class="flex items-center gap-2 mb-4 px-1">
              <div class="status-dot" :class="proxyOnline ? 'status-dot-online' : 'status-dot-offline'"></div>
              <span class="text-caption" style="color: var(--text-tertiary)">
                {{ proxyOnline ? '服务在线' : '服务离线' }}
              </span>
            </div>
            
            <button
              type="submit"
              :disabled="loading || !proxyOnline"
              class="btn btn-accent w-full"
            >
              <span v-if="!loading">{{ mode === 'login' ? '登录' : '重置密码' }}</span>
              <div v-else class="spinner"></div>
            </button>
          </div>
          
          <!-- Back to login -->
          <div v-if="mode === 'reset'" class="text-center pt-2">
            <a href="#" @click.prevent="mode = 'login'" class="text-callout" style="color: var(--text-secondary)">
              返回登录
            </a>
          </div>
          
        </form>
      </div>
      
      <!-- Footer -->
      <div class="text-center mt-8 animate-slide-up" style="animation-delay: 200ms">
        <p class="text-caption" style="color: var(--text-quaternary)">
          成都信息工程大学
        </p>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/sdk/app';
import { useDataStore } from '@/composables/useDataStore';

const rootShowMessage = inject('showMessage', null);
const { userInfo, fetchUserData, rememberLogin, savedPhone } = useDataStore();
const router = useRouter();

const mode = ref('login');
const phone = ref('');
const password = ref('');
const code = ref('');
const rememberMe = ref(!!rememberLogin.value);
const loading = ref(false);
const sending = ref(false);
const proxyOnline = ref(false);

async function checkProxyStatus() {
  try {
    const resp = await fetch('/devproxy/health');
    const data = await resp.json();
    proxyOnline.value = data.status === 'ok';
  } catch (e) {
    proxyOnline.value = false;
  }
}

function showMessage(message, type = 'info') {
  if (typeof rootShowMessage === 'function') {
    rootShowMessage(message, type);
  }
}

onMounted(() => {
  if (rememberMe.value) {
    phone.value = savedPhone.value || '';
  }
  checkProxyStatus();
  setInterval(checkProxyStatus, 30000);
});

watch(rememberMe, (val) => {
  rememberLogin.value = !!val;
  if (!val) savedPhone.value = '';
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
      try { await fetchUserData(); } catch (e) {}
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
      showMessage('密码重置成功', 'success');
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
