<template>
  <div class="min-h-full flex flex-col bg-primary">
    
    <!-- Ambient gradient -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25"
           style="background: radial-gradient(circle, var(--claude-orange) 0%, transparent 70%); filter: blur(40px)"></div>
      <div class="absolute -bottom-48 -left-48 w-[32rem] h-[32rem] rounded-full opacity-15"
           style="background: radial-gradient(circle, var(--claude-blue) 0%, transparent 70%); filter: blur(60px)"></div>
    </div>
    
    <!-- Content -->
    <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
      
      <!-- Logo -->
      <div class="mb-12 text-center animate-scale-in">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-[22px] mb-6"
             style="background: linear-gradient(135deg, var(--claude-orange), #e89a7a); 
                    box-shadow: 0 8px 24px rgba(217, 119, 87, 0.25)">
          <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.145 1.978a1 1 0 0 1 1.318 0l5.847 5.127a1 1 0 0 1 .247 1.311l-2.25 3.45a1 1 0 0 1-1.08.435l-4.357-1.196a1 1 0 0 0-.86.2l-3.793 2.903a1 1 0 0 0-.142 1.448l4.49 5.013a1 1 0 0 1-.006 1.376L9.11 22.3a1 1 0 0 1-1.092.297l-5.764-1.98a1 1 0 0 1-.66-1.088L3.138 10.06a1 1 0 0 1 .552-.836l9.455-7.246z"/>
          </svg>
        </div>
        <h1 class="t-title text-primary">Byerun</h1>
        <p class="t-callout mt-1.5 text-secondary">校园跑步 · 轻松完成</p>
      </div>
      
      <!-- Form Card -->
      <div class="w-full max-w-[380px] card-glass p-8 animate-slide-up space-y-5">
        
        <!-- Phone -->
        <div>
          <label class="t-label block mb-2">手机号</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            required
            class="input"
          />
        </div>
        
        <!-- Password -->
        <div v-if="mode === 'login'">
          <label class="t-label block mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            required
            class="input"
          />
        </div>
        
        <!-- Reset Fields -->
        <template v-if="mode === 'reset'">
          <div>
            <label class="t-label block mb-2">新密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="设置新密码"
              required
              class="input"
            />
          </div>
          <div>
            <label class="t-label block mb-2">验证码</label>
            <div class="flex gap-2">
              <input v-model="code" placeholder="验证码" required class="input flex-1" />
              <button type="button" @click="sendCode" :disabled="sending" class="btn btn-ghost whitespace-nowrap">
                <div v-if="sending" class="spinner"></div>
                <span v-else>发送</span>
              </button>
            </div>
          </div>
        </template>
        
        <!-- Options -->
        <div v-if="mode === 'login'" class="flex items-center justify-between py-1">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" v-model="rememberMe" class="hidden" />
            <div class="w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-150"
                 :style="rememberMe ? 'background: var(--claude-orange); border-color: var(--claude-orange)' : 'border-color: var(--claude-border-strong)'">
              <svg v-if="rememberMe" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="t-callout text-secondary">记住我</span>
          </label>
          <a href="#" @click.prevent="mode = 'reset'" class="t-callout font-medium" style="color: var(--claude-orange)">忘记密码？</a>
        </div>
        
        <!-- Proxy Status -->
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :style="{ background: proxyOnline ? 'var(--claude-green)' : '#d97757', boxShadow: proxyOnline ? '0 0 6px rgba(120, 140, 93, 0.4)' : '0 0 6px rgba(217, 119, 87, 0.4)' }"></div>
          <span class="t-caption">{{ proxyOnline ? '服务在线' : '服务离线' }}</span>
        </div>
        
        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading || !proxyOnline"
          @click="handleSubmit"
          class="btn btn-accent w-full mt-1"
        >
          <div v-if="loading" class="spinner"></div>
          <span v-else>{{ mode === 'login' ? '登录' : '重置密码' }}</span>
        </button>
        
        <div v-if="mode === 'reset'" class="text-center">
          <a href="#" @click.prevent="mode = 'login'" class="t-callout text-secondary">返回登录</a>
        </div>
        
      </div>
      
      <!-- Footer -->
      <p class="t-caption mt-8 animate-fade-in">成都信息工程大学</p>
      
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, watch } from 'vue';
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
  } catch (e) { proxyOnline.value = false; }
}

function showMessage(message, type = 'info') {
  if (typeof rootShowMessage === 'function') rootShowMessage(message, type);
}

onMounted(() => {
  if (rememberMe.value) phone.value = savedPhone.value || '';
  checkProxyStatus();
  setInterval(checkProxyStatus, 30000);
});

watch(rememberMe, (val) => {
  rememberLogin.value = !!val;
  if (!val) savedPhone.value = '';
});

const sendCode = async () => {
  if (!phone.value) { showMessage('请输入手机号', 'error'); return; }
  sending.value = true;
  try {
    const { data } = await api.sendVerifyCode(phone.value);
    showMessage(data.code === 10000 ? '验证码已发送' : data.msg || '发送失败', data.code === 10000 ? 'success' : 'error');
  } catch (e) { showMessage('发送异常', 'error'); }
  finally { sending.value = false; }
};

const handleLogin = async () => {
  loading.value = true;
  try {
    const { data } = await api.login(phone.value, password.value);
    if (data.code === 10000) {
      if (rememberMe.value) savedPhone.value = phone.value; else savedPhone.value = '';
      userInfo.value = data.response;
      try { await fetchUserData(); } catch (e) {}
      router.replace({ name: 'home' }).catch(() => {});
    } else { showMessage(data.msg, 'error'); }
  } catch (e) { showMessage('登录失败', 'error'); }
  finally { loading.value = false; }
};

const handleReset = async () => {
  if (!code.value) { showMessage('请输入验证码', 'error'); return; }
  loading.value = true;
  try {
    const { data } = await api.updatePassword(phone.value, password.value, code.value);
    if (data.code === 10000) {
      showMessage('密码重置成功', 'success');
      phone.value = ''; password.value = ''; code.value = ''; mode.value = 'login';
    } else { showMessage(data.msg || '重置失败', 'error'); }
  } catch (e) { showMessage('重置异常', 'error'); }
  finally { loading.value = false; }
};

const handleSubmit = () => { mode.value === 'login' ? handleLogin() : handleReset(); };
</script>
