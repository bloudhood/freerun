<template>
  <div class="w-full">
    
    <!-- Records List -->
    <div v-if="records.length > 0 || loading" class="space-y-3">
      <div
        v-for="(record, index) in loading ? Array(5).fill(null) : records"
        :key="loading ? index : record.key"
        class="card overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 pb-3">
          <div v-if="!loading" class="text-callout" style="color: var(--text-primary)">
            {{ formatCreateTime(record.createTime) }}
          </div>
          <div v-else class="w-32 h-5 rounded-lg animate-pulse" style="background: var(--bg-tertiary)"></div>
          
          <span v-if="!loading"
                class="text-caption px-3 py-1 rounded-full font-medium"
                :style="{
                  background: record.runStatus === '1' ? 'var(--success-muted)' : 'var(--warning-muted)',
                  color: record.runStatus === '1' ? 'var(--success)' : 'var(--warning)'
                }">
            {{ record.defeatedInfo }}
          </span>
          <div v-else class="w-16 h-5 rounded-full animate-pulse" style="background: var(--bg-tertiary)"></div>
        </div>
        
        <!-- Stats -->
        <div class="px-4 pb-4 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-caption" style="color: var(--text-secondary)">跑步里程</span>
            <span v-if="!loading" class="text-caption font-medium" style="color: var(--text-primary)">
              {{ (record.runDistance / 1000).toFixed(2) }} km
            </span>
            <div v-else class="w-16 h-4 rounded animate-pulse" style="background: var(--bg-tertiary)"></div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-caption" style="color: var(--text-secondary)">跑步时长</span>
            <span v-if="!loading" class="text-caption font-medium" style="color: var(--text-primary)">
              {{ record.runTime }} 分钟
            </span>
            <div v-else class="w-16 h-4 rounded animate-pulse" style="background: var(--bg-tertiary)"></div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-caption" style="color: var(--text-secondary)">平均配速</span>
            <span v-if="!loading" class="text-caption font-medium" style="color: var(--text-primary)">
              {{ formatPaceDetail(record.runTime, record.runDistance) }}
            </span>
            <div v-else class="w-16 h-4 rounded animate-pulse" style="background: var(--bg-tertiary)"></div>
          </div>
        </div>
      </div>
      
      <!-- Load More -->
      <div class="text-center py-4">
        <button
          class="btn btn-ghost text-callout"
          :disabled="isLoading"
          @click="loadMoreRecords"
        >
          <div v-if="isLoading" class="spinner"></div>
          <span>{{ isLoading ? '加载中...' : '加载更多' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <div class="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
           style="background: var(--accent-muted)">
        <svg class="w-8 h-8" style="color: var(--accent)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p class="text-callout" style="color: var(--text-secondary)">暂无跑步记录</p>
    </div>
    
  </div>
</template>

<script setup>
import { onMounted, inject, watch } from 'vue';
import { useRunRecords } from '@/composables/useRun';
import { useDataStore } from '@/composables/useDataStore';

const showMessage = inject('showMessage');
const { loading: profileLoading } = useDataStore();

const {
  records,
  loading,
  isLoading,
  fetchRecords,
  loadMoreRecords,
  formatCreateTime,
  formatPaceDetail,
} = useRunRecords({ onMessage: showMessage });

onMounted(() => {
  fetchRecords();
});

watch(
  () => profileLoading.value,
  (v, oldV) => {
    if (oldV === true && v === false) {
      fetchRecords();
    }
  }
);
</script>
