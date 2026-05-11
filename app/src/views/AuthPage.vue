<template>
  <div class="min-h-full flex flex-col bg-primary">
    
    <!-- Ambient glow — softer, more subtle -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full"
           style="background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%); opacity: 0.6"></div>
      <div class="absolute -bottom-56 -left-56 w-[36rem] h-[36rem] rounded-full"
           style="background: radial-gradient(circle, var(--blue-soft) 0%, transparent 70%); opacity: 0.4"></div>
    </div>
    
    <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
      
      <!-- Logo -->
      <div class="mb-14 text-center animate-scale-in">
        <div class="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] mb-7"
             style="background: var(--accent-gradient); box-shadow: var(--shadow-accent)">
          <svg class="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.145 1.978a1 1 0 0 1 1.318 0l5.847 5.127a1 1 0 0 1 .247 1.311l-2.25 3.45a1 1 0 0 1-1.08.435l-4.357-1.196a1 1 0 0 0-.86.2l-3.793 2.903a1 1 0 0 0-.142 1.448l4.49 5.013a1 1 0 0 1-.006 1.376L9.11 22.3a1 1 0 0 1-1.092.297l-5.764-1.98a1 1 0 0 1-.66-1.088L3.138 10.06a1 1 0 0 1 .552-.836l9.455-7.246z"/>
          </svg>
        </div>
        <h1 class="t-display" style="font-size: 2rem">Byerun</h1>
        <p class="t-callout mt-2 text-secondary">校园跑步 · 轻松完成</p>
      </div>
      
      <!-- Card -->
      <div class="w-full max-w-[380px] card-glass px-7 py-7 animate-fade-up space-y-5" style="animation-delay: 80ms">
        
        <div>
          <label class="t-label block mb-2">手机号</label>
          <input v-model="phone" type="tel" placeholder="请输入手机号" required class="input" autocomplete="tel" />
        </div>
        
        <div v-if="mode === 'login'">
          <label class="t-label block mb-2">密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" required class="input" autocomplete="current-password" />
        </div>
        
        <template v-if="mode === 'reset'">
          <div>
            <label class="t-label block mb-2">新密码</label>
            <input v-model="password" type="password" placeholder="设置新密码" required class="input" />
          </div>
          <div>
            <label class="t-label block mb-2">验证码</label>
            <div class="flex gap-2">
              <input v-model="code" placeholder="验证码" required class="input flex-1" autocomplete="one-time-code" />
              <button type="button" @click="sendCode" :disabled="sending" class="btn btn-ghost shrink-0 whitespace-nowrap">
                <div v-if="sending" class="spinner"></div>
                <span v-else>发送验证码</span>
              </button>
            </div>
          </div>
        </template>
        
        <!-- Options row -->
        <div v-if="mode === 'login'" class="flex items-center justify-between py-1">
          <label class="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" v-model="rememberMe" class="hidden" />
            <div class="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-150"
                 :style="{ background: rememberMe ? 'var(--accent)' : 'var(--bg-sunken)', border: rememberMe ? 'none' : '1.5px solid var(--border-strong)' }">
              <svg v-if="rememberMe" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="t-caption" style="color: var(--fg-secondary)">记住我</span>
          </label>
          <a href="#" @click.prevent="mode = 'reset'" class="t-caption font-medium" style="color: var(--accent)">忘记密码？</a>
        </div>
        
        <!-- Proxy -->
        <div class="flex items-center gap-2.5 py-1">
          <div class="status-dot" :class="proxyOnline ? 'status-dot-online' : 'status-dot-offline'"></div>
          <span class="t-caption" style="color: var(--fg-tertiary)">{{ proxyOnline ? '代理服务器在线' : '代理服务器离线' }}</span>
        </div>
        
        <button type="submit" @click="handleSubmit" :disabled="loading || !proxyOnline" class="btn btn-accent w-full">
          <div v-if="loading" class="spinner"></div>
          <span v-else>{{ mode === 'login' ? '登录' : '重置密码' }}</span>
        </button>
        
        <div v-if="mode === 'reset'" class="text-center pt-1">
          <a href="#" @click.prevent="mode = 'login'" class="t-caption text-secondary">返回登录</a>
        </div>
        
      </div>
      
      <p class="t-caption mt-10 animate-fade-in" style="animation-delay: 200ms; color: var(--fg-quaternary)">成都信息工程大学</p>
      
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
  try { const r = await fetch('/devproxy/health'); const d = await r.json(); proxyOnline.value = d.status === 'ok'; }
  catch { proxyOnline.value = false; }
}
function msg(m, t) { if (typeof rootShowMessage === 'function') rootShowMessage(m, t); }

onMounted(() => { if (rememberMe.value) phone.value = savedPhone.value || ''; checkProxyStatus(); setInterval(checkProxyStatus, 30000); });
watch(rememberMe, v => { rememberLogin.value = !!v; if (!v) savedPhone.value = ''; });

const sendCode = async () => {
  if (!phone.value) { msg('请输入手机号', 'error'); return; }
  sending.value = true;
  try { const { data } = await api.sendVerifyCode(phone.value); msg(data.code === 10000 ? '验证码已发送' : data.msg || '发送失败', data.code === 10000 ? 'success' : 'error'); }
  catch { msg('发送异常', 'error'); } finally { sending.value = false; }
};

const handleLogin = async () => {
  loading.value = true;
  try {
    const { data } = await api.login(phone.value, password.value);
    if (data.code === 10000) { if (rememberMe.value) savedPhone.value = phone.value; else savedPhone.value = ''; userInfo.value = data.response; try { await fetchUserData(); } catch {} router.replace({ name: 'home' }).catch(() => {}); }
    else msg(data.msg, 'error');
  } catch { msg('登录失败', 'error'); } finally { loading.value = false; }
};

const handleReset = async () => {
  if (!code.value) { msg('请输入验证码', 'error'); return; }
  loading.value = true;
  try { const { data } = await api.updatePassword(phone.value, password.value, code.value); if (data.code === 10000) { msg('密码重置成功', 'success'); phone.value = ''; password.value = ''; code.value = ''; mode.value = 'login'; } else msg(data.msg || '重置失败', 'error'); }
  catch { msg('重置异常', 'error'); } finally { loading.value = false; }
};

const handleSubmit = () => { mode.value === 'login' ? handleLogin() : handleReset(); };
</script>
