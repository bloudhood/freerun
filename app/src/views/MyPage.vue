<template>
  <div class="w-full max-w-md mx-auto py-4 space-y-4">
    
    <!-- Profile Card -->
    <div class="card p-5 animate-fade-in">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4 min-w-0">
          <!-- Avatar -->
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
               style="background: linear-gradient(135deg, var(--accent) 0%, #ff8f65 100%); box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3)">
            <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          
          <!-- Info -->
          <div class="min-w-0">
            <p class="text-headline truncate" style="color: var(--text-primary)">{{ displayName }}</p>
            <p class="text-caption mt-0.5 truncate" style="color: var(--text-secondary)">{{ registerCode }}</p>
          </div>
        </div>
        
        <!-- Logout -->
        <button
          type="button"
          @click="handleLogout"
          class="btn btn-ghost px-4 py-2 text-caption font-medium"
          style="color: var(--destructive); background: var(--destructive-muted)"
        >
          登出
        </button>
      </div>
    </div>
    
    <!-- Sponsor Card -->
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
  try { clearAllData(); } catch (e) {}
  window.location.reload();
};
</script>
