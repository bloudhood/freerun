<template>
  <div class="space-y-3">
    <div v-if="records.length || loading" class="space-y-3">
      <!-- Skeleton -->
      <template v-if="loading">
        <div v-for="i in 4" :key="'sk'+i" class="card px-4 py-4" aria-hidden="true">
          <div class="flex items-center justify-between mb-3">
            <div class="skeleton w-32 h-5"></div>
            <div class="skeleton w-14 h-5 rounded-full"></div>
          </div>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between"><div class="skeleton w-16 h-4"></div><div class="skeleton w-20 h-4"></div></div>
            <div class="flex items-center justify-between"><div class="skeleton w-16 h-4"></div><div class="skeleton w-20 h-4"></div></div>
            <div class="flex items-center justify-between"><div class="skeleton w-16 h-4"></div><div class="skeleton w-20 h-4"></div></div>
          </div>
        </div>
      </template>
      
      <!-- Records -->
      <div v-for="r in records" :key="r.key" class="card px-4 py-4 animate-fade-up">
        <div class="flex items-center justify-between mb-3">
          <span class="t-callout font-medium text-primary">{{ formatCreateTime(r.createTime) }}</span>
          <span class="badge" :class="r.runStatus === '1' ? 'badge-success' : 'badge-warning'">{{ r.defeatedInfo }}</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between"><span class="t-caption" style="font-size: 14px; color: var(--fg-secondary)">跑步里程</span><span class="t-callout font-medium text-primary">{{ (r.runDistance / 1000).toFixed(2) }} km</span></div>
          <div class="flex items-center justify-between"><span class="t-caption" style="font-size: 14px; color: var(--fg-secondary)">跑步时长</span><span class="t-callout font-medium text-primary">{{ r.runTime }} 分钟</span></div>
          <div class="flex items-center justify-between"><span class="t-caption" style="font-size: 14px; color: var(--fg-secondary)">平均配速</span><span class="t-callout font-medium text-primary">{{ formatPaceDetail(r.runTime, r.runDistance) }}</span></div>
        </div>
      </div>
      
      <div class="text-center py-4">
        <button class="btn btn-ghost" :disabled="isLoading" @click="loadMoreRecords"><div v-if="isLoading" class="spinner"></div><span>{{ isLoading ? '加载中...' : '加载更多' }}</span></button>
      </div>
    </div>
    
    <div v-else class="flex flex-col items-center justify-center py-24 animate-fade-in">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style="background: var(--accent-soft)">
        <svg class="w-8 h-8" style="color: var(--accent)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <p class="t-callout font-medium text-secondary">暂无跑步记录</p>
      <p class="t-caption mt-1 text-tertiary">提交跑步后这里会显示记录</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject, watch } from 'vue';
import { useRunRecords } from '@/composables/useRun';
import { useDataStore } from '@/composables/useDataStore';
const showMessage = inject('showMessage');
const { loading: profileLoading } = useDataStore();
const { records, loading, isLoading, fetchRecords, loadMoreRecords, formatCreateTime, formatPaceDetail } = useRunRecords({ onMessage: showMessage });
onMounted(() => fetchRecords());
watch(() => profileLoading.value, (v, o) => { if (o === true && v === false) fetchRecords(); });
</script>
