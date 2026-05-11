<template>
  <div class="w-full max-w-md mx-auto py-4 space-y-4">
    <div class="card p-5 animate-scale-in">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style="background: linear-gradient(135deg, var(--claude-orange), #e89a7a); box-shadow: 0 4px 16px rgba(217, 119, 87, 0.25)">
            <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="min-w-0">
            <p class="t-headline text-primary truncate">{{ displayName }}</p>
            <p class="t-caption mt-0.5">{{ registerCode }}</p>
          </div>
        </div>
        <button type="button" @click="handleLogout" class="btn btn-ghost px-4 py-2 t-callout font-medium" style="background: rgba(217, 119, 87, 0.12); color: #d97757; border-radius: 12px">登出</button>
      </div>
    </div>
    <SponsorCard v-if="sponsorCardVisible" :sponsor="sponsor" :domain="domain" :community="community" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDataStore } from '@/composables/useDataStore';
import { pingMeta } from '@/sdk/autorun';
import SponsorCard from '@/components/SponsorCard.vue';
const { userInfo, clearAllData } = useDataStore();
const displayName = computed(() => userInfo.value?.studentName ?? '');
const registerCode = computed(() => userInfo.value?.registerCode ?? '');
const sponsor = computed(() => pingMeta.value?.sponsor);
const domain = computed(() => pingMeta.value?.domain);
const community = computed(() => pingMeta.value?.community ?? null);
const sponsorCardVisible = computed(() => Boolean(sponsor.value && domain.value));
const handleLogout = () => { try { clearAllData(); } catch (e) {} window.location.reload(); };
</script>
