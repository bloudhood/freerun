<template>
  <nav class="fixed left-0 right-0 bottom-4 z-[999] px-4" :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }">
    <div class="card-glass max-w-[380px] mx-auto px-2 py-2" style="border-radius: 18px">
      <div class="flex items-center justify-around">
        <button v-for="item in tabs" :key="item.key" type="button" @click="handleClick(item)"
          class="flex flex-col items-center justify-center py-2 px-5 rounded-xl transition-all"
          :style="{ background: active === item.key ? 'var(--claude-orange-soft)' : 'transparent', color: active === item.key ? 'var(--claude-orange)' : 'var(--claude-fg-tertiary)' }">
          <svg class="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <template v-if="item.key === 'club'">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </template>
            <template v-if="item.key === 'records'">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </template>
            <template v-if="item.key === 'submit'">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </template>
            <template v-if="item.key === 'my'">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </template>
          </svg>
          <span class="t-label" style="font-size: 10px; font-weight: 500; letter-spacing: 0.02em">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
const emit = defineEmits(['update:active', 'switch']);
defineProps({ active: { type: String, default: 'submit' }, isDarkMode: { type: Boolean, default: false }, tabs: { type: Array, default: () => [{ key: 'club', label: '俱乐部' }, { key: 'records', label: '记录' }, { key: 'submit', label: '提交' }, { key: 'my', label: '我的' }] } });
function handleClick(item) { emit('update:active', item.key); emit('switch', item.key); }
</script>
