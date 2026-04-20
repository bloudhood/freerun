<template>
  <div class="w-full max-w-3xl mx-auto py-4 px-2 space-y-5">
    <section class="corner-apple-inner glass-apple animate-fade-in">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="h-14 w-14 rounded-2xl bg-anthropic-orange/10 dark:bg-anthropic-orange/20 text-anthropic-orange flex items-center justify-center shadow-inner"
          >
            <i class="ri-user-3-line text-2xl"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xl font-heading font-medium text-anthropic-dark dark:text-anthropic-light truncate">{{ displayName }}</p>
            <p class="text-sm font-body text-anthropic-mid-gray truncate mt-0.5">{{ registerCode }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="handleLogout"
          class="btn-apple shrink-0 text-sm cursor-pointer inline-flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-2.5 rounded-xl font-heading"
        >
          <span>登出</span>
        </button>
      </div>
    </section>

    <SponsorCard
      v-if="sponsorCardVisible"
      :sponsor="sponsor"
      :domain="domain"
      :community="community"
    />
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

const handleLogout = () => {
  try {
    clearAllData();
  } catch (e) {}
  window.location.reload();
};
</script>
