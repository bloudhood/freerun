<template>
  <div class="space-y-3">
    <div v-if="records.length || loading" class="space-y-3">
      <div v-for="(r, i) in loading ? Array(5).fill(null) : records" :key="loading ? i : r.key" class="card px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <span v-if="!loading" class="t-callout font-medium text-primary">{{ formatCreateTime(r.createTime) }}</span>
          <div v-else class="w-28 h-5 rounded-md animate-pulse bg-sunken"></div>
          <span v-if="!loading" class="badge" :class="r.runStatus === '1' ? 'badge-success' : 'badge-warning'">{{ r.defeatedInfo }}</span>
          <div v-else class="w-14 h-5 rounded-full animate-pulse bg-sunken"></div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="t-caption" style="font-size: 14px; color: var(--claude-fg-secondary)">跑步里程</span>
            <span v-if="!loading" class="t-callout font-medium text-primary">{{ (r.runDistance / 1000).toFixed(2) }} km</span>
            <div v-else class="w-16 h-4 rounded animate-pulse bg-sunken"></div>
          </div>
          <div class="flex items-center justify-between">
            <span class="t-caption" style="font-size: 14px; color: var(--claude-fg-secondary)">跑步时长</span>
            <span v-if="!loading" class="t-callout font-medium text-primary">{{ r.runTime }} 分钟</span>
            <div v-else class="w-16 h-4 rounded animate-pulse bg-sunken"></div>
          </div>
          <div class="flex items-center justify-between">
            <span class="t-caption" style="font-size: 14px; color: var(--claude-fg-secondary)">平均配速</span>
            <span v-if="!loading" class="t-callout font-medium text-primary">{{ formatPaceDetail(r.runTime, r.runDistance) }}</span>
            <div v-else class="w-16 h-4 rounded animate-pulse bg-sunken"></div>
          </div>
        </div>
      </div>
      <div class="text-center py-4">
        <button class="btn btn-ghost" :disabled="isLoading" @click="loadMoreRecords">
          <div v-if="isLoading" class="spinner"></div>
          <span>{{ isLoading ? '加载中...' : '加载更多' }}</span>
        </button>
      </div>
    </div>
    
    <div v-else class="flex flex-col items-center justify-center py-24">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style="background: var(--claude-orange-soft)">
        <svg class="w-8 h-8" style="color: var(--claude-orange)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p class="t-callout text-secondary">暂无跑步记录</p>
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
