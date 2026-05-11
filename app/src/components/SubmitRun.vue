<template>
  <div class="flex-1 flex flex-col min-h-0">
    
    <!-- Stats -->
    <div class="card px-5 py-5 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="t-headline text-primary">完成情况</h3>
        <span class="t-caption" v-if="stats.semesterEndDateText" style="color: var(--fg-tertiary)">{{ stats.semesterEndDateText }}</span>
      </div>
      <div class="grid grid-cols-3 gap-2.5">
        <div v-for="c in summaryCards" :key="c.label" class="text-center py-3 px-2 rounded-2xl" style="background: var(--accent-soft)">
          <div class="t-headline" style="color: var(--accent); line-height: 1.1">{{ c.value }}</div>
          <div class="t-label mt-1.5" style="color: var(--fg); letter-spacing: 0.03em; font-size: 11px">{{ c.label }}</div>
          <div class="t-caption mt-0.5" style="font-size: 12px; color: var(--fg-tertiary)">{{ c.detail }}</div>
        </div>
      </div>
    </div>
    
    <form @submit.prevent="onFormSubmit" class="flex-1 flex flex-col min-h-0">
      <div class="card px-5 py-5 mb-4">
        
        <!-- Segmented Control -->
        <div class="segmented mb-5">
          <button v-for="tab in tabs" :key="tab.key" type="button" @click="activeTab = tab.key"
            class="segmented-btn" :class="{ active: activeTab === tab.key }">{{ tab.label }}</button>
        </div>
        
        <div v-show="activeTab === 'submit'" class="space-y-4">
          
          <!-- Route -->
          <div>
            <label class="t-label block mb-2">选择路线</label>
            <div class="relative">
              <button type="button" @click="mapsLoaded && !submitting ? showRouteOptions = !showRouteOptions : null"
                class="input flex items-center justify-between w-full text-left pr-3" :style="{ opacity: mapsLoaded && !submitting ? 1 : 0.5, cursor: mapsLoaded && !submitting ? 'pointer' : 'default' }">
                <span class="t-callout text-primary">{{ mapsLoaded ? getRouteName(form.route) : '加载中...' }}</span>
                <svg class="w-4 h-4 transition-transform text-tertiary shrink-0" :style="{ transform: showRouteOptions ? 'rotate(180deg)' : 'rotate(0)' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <transition name="drop">
                <div v-if="showRouteOptions && mapsLoaded" class="card-elevated absolute left-0 right-0 top-full mt-2 py-1 z-50 max-h-[200px] overflow-y-auto" style="border-radius: var(--radius-input)">
                  <button v-for="(name, value) in routeOptions" :key="value" type="button" @click.stop="selectRoute(value)"
                    class="w-full px-4 py-2.5 text-left t-callout transition-colors" :style="{ color: form.route === value ? 'var(--accent)' : 'var(--fg)', background: form.route === value ? 'var(--accent-soft)' : 'transparent' }">{{ name }}</button>
                </div>
              </transition>
            </div>
          </div>
          
          <!-- Distance + Duration -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="t-label">跑步数据</label>
              <span class="t-caption text-tertiary">配速 {{ paceDisplay }}</span>
            </div>
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <input v-model.number="form.distance" type="number" step="1" placeholder="距离" required class="input pr-14" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 t-caption text-tertiary select-none">米</span>
              </div>
              <div class="flex-1 relative">
                <input v-model.number="form.duration" type="number" placeholder="时间" class="input pr-14" :class="{ 'opacity-50': !userTyping }" @focus="userTyping = true" @blur="onDurationBlur" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 t-caption text-tertiary select-none">分</span>
              </div>
              <button type="button" @click="onRandomFill" :disabled="submitting || randomizing" class="btn btn-ghost shrink-0 px-3" style="border-radius: var(--radius-input); background: var(--bg-sunken)">
                <svg v-if="!randomizing" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                <div v-else class="spinner"></div>
              </button>
            </div>
          </div>
          
          <!-- Submit -->
          <div class="pt-1">
            <transition name="swap" mode="out-in">
              <button v-if="!awaitingSubmitConfirm" key="submit" type="submit" class="btn btn-accent w-full" :disabled="submitting || !isFormValid">提交记录</button>
              <div v-else key="confirm" class="flex gap-2">
                <button type="button" class="btn btn-ghost flex-1" style="background: var(--bg-sunken)" :disabled="submitting" @click="cancelSubmitConfirm">取消</button>
                <button type="button" class="btn btn-accent flex-1" :disabled="submitting || !isFormValid" @click="confirmSubmit"><div v-if="submitting" class="spinner"></div><span v-else>确认提交</span></button>
              </div>
            </transition>
          </div>
          
        </div>
        
        <div v-show="activeTab === 'schedule'"><div v-if="schedulePanelMounted"><AutoConfig inline @saved="onAutoConfigSaved" /></div></div>
        
      </div>
    </form>
    
    <div v-show="activeTab === 'submit'" class="card px-5 py-5">
      <h3 class="t-label mb-3">路线预览</h3>
      <MapPreview v-if="mapRenderUnlocked" :track="generatedTrack" :ready="mapReady" :map-style="isDark ? 'dark' : 'light'" class="w-full" />
      <div v-else class="w-full h-40 rounded-xl skeleton"></div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, defineAsyncComponent, onMounted } from 'vue';
import { submitRun as submitRunApi, useRouteGenerator } from '@/composables/useRun';
import { useDataStore } from '@/composables/useDataStore';
import { useThemeStore } from '@/composables/useTheme';
import { waitForAutorunPingReady } from '@/sdk/autorun';
import { computeDurationFromDistance, formatPaceMinutesPerKm, normalizeRoundedRunTime, randomIntNonThousand, resolveRunBoundsFromStandard, isPaceWithinLimits } from '@/utils/run';

const MapPreview = defineAsyncComponent(() => import('./MapPreview.vue'));
const AutoConfig = defineAsyncComponent(() => import('./AutoConfig.vue'));
const showMessage = inject('showMessage');
const { userInfo, runStandard, runInfo, activityInfo, submitRunDistance, submitRunRoute } = useDataStore();
const emit = defineEmits(['submitted']);

const tabs = [{ key: 'submit', label: '手动提交' }, { key: 'schedule', label: '自动提交' }];
const activeTab = ref('submit'); const schedulePanelMounted = ref(false);
watch(activeTab, t => { if (t === 'schedule') schedulePanelMounted.value = true; }, { immediate: true });

const form = ref({ distance: submitRunDistance.value, route: submitRunRoute.value, duration: 0 });
const mapRenderUnlocked = ref(false); const submitting = ref(false); const randomizing = ref(false); const awaitingSubmitConfirm = ref(false); const showRouteOptions = ref(false);
const themeStore = useThemeStore(); const isDark = computed(() => themeStore.isDark);

const bounds = computed(() => resolveRunBoundsFromStandard(userInfo.value || {}, runStandard.value || {}));
const isDistanceValid = computed(() => { const d = Number(form.value.distance); return Number.isInteger(d) && d > 0; });
const isPaceValid = computed(() => { const d = Number(form.value.distance); const t = userDuration.value || Math.floor(predictedRunTime.value); return d && t ? isPaceWithinLimits(d, t) : false; });
const isFormValid = computed(() => isDistanceValid.value && isPaceValid.value);

const predictedRunTime = ref(0);
const calcTime = d => { if (!Number.isInteger(d) || d <= 0) return 0; return normalizeRoundedRunTime(computeDurationFromDistance(d, { minMinutes: bounds.value.timeMin, maxMinutes: bounds.value.timeMax }), d, { minMinutes: bounds.value.timeMin, maxMinutes: bounds.value.timeMax }); };
const userTyping = ref(false);
watch(() => Number(form.value.distance), d => { if (!userTyping.value) { const t = calcTime(d); predictedRunTime.value = t; form.value.duration = Math.floor(t); } }, { immediate: true });
watch(() => form.value.duration, d => { if (!userTyping.value) return; if (d > 0) predictedRunTime.value = 0; });

const userDuration = computed(() => { const d = Number(form.value.duration); return Number.isInteger(d) && d > 0 ? d : 0; });
const paceDisplay = computed(() => { const d = Number(form.value.distance); const t = userDuration.value || Math.floor(predictedRunTime.value); return Number.isInteger(d) && d > 0 && t ? formatPaceMinutesPerKm(d, t) : "0'00''/km"; });

const buildRandom = () => { const b = bounds.value; const d = randomIntNonThousand(b.distanceMin, b.distanceMax); const rt = normalizeRoundedRunTime(computeDurationFromDistance(d, { minMinutes: b.timeMin, maxMinutes: b.timeMax }), d, { minMinutes: b.timeMin, maxMinutes: b.timeMax }); return { map_id: String(form.value.route || selectedRoute.value || 'default').trim() || 'default', run_distance: d, run_time: rt, track_points: '' }; };
const applyRandom = rr => { if (!rr) return; const id = String(rr.map_id || '').trim(); if (id && Object.prototype.hasOwnProperty.call(routeOptions.value, id)) { selectMapRoute(id); form.value.route = id; } form.value.distance = rr.run_distance; };

function onDurationBlur() { userTyping.value = false; if (!form.value.duration || form.value.duration <= 0) { const t = calcTime(form.value.distance); predictedRunTime.value = t; form.value.duration = Math.floor(t); } }

async function onRandomFill() { if (submitting.value || randomizing.value) return; randomizing.value = true; userTyping.value = false; try { const rr = buildRandom(); applyRandom(rr); predictedRunTime.value = rr.run_time || calcTime(Number(form.value.distance)); form.value.duration = Math.floor(predictedRunTime.value); } finally { randomizing.value = false; awaitingSubmitConfirm.value = false; } }

watch(() => [form.value.distance, form.value.route], ([d, r]) => { submitRunDistance.value = d; submitRunRoute.value = r; awaitingSubmitConfirm.value = false; });

const { mapsLoaded, routeOptions, selectedRoute, load: loadMaps, selectRoute: selectMapRoute, getRouteName, generatedTrack, mapReady } = useRouteGenerator(computed(() => form.value.distance), computed(() => form.value.route));

const stats = computed(() => { const s = runStandard.value || {}; const sem = String(s.semesterYear || '').slice(-1); return { semesterEndDateText: sem === '1' ? s.firstSemesterDateEnd || '' : sem === '2' ? s.secondSemesterDateEnd || '' : '' }; });

const summaryCards = computed(() => {
  const a = activityInfo.value || {}, r = runInfo.value || {}, s = runStandard.value || {}, u = userInfo.value || {};
  const ca = Number(a.joinNum || 0), ta = Number(a.totalNum || 0);
  const required = u.gender === '1' ? Number(s.boyAllRunTime || 0) : u.gender === '2' ? Number(s.girlAllRunTime || 0) : 0;
  const completed = Number(r.runValidCount || 0);
  const dist = Number(r.runValidDistance || 0);
  const targetDist = u.gender === '1' ? Number(s.boyAllRunDistance || 0) : u.gender === '2' ? Number(s.girlAllRunDistance || 0) : 0;
  return [
    { label: '俱乐部', value: ta ? `${Math.round(ca/ta*100)}%` : '0%', detail: `${ca}/${ta}` },
    { label: '跑步次数', value: `${required ? Math.min(100, Math.round(completed/required*100)) : 0}%`, detail: `${completed}/${required}` },
    { label: '跑步里程', value: `${targetDist ? Math.min(100, Math.round(dist/targetDist*100)) : 0}%`, detail: `${(Math.floor(dist/1000*10)/10).toFixed(1)}/${(targetDist/1000).toFixed(1)}` },
  ];
});

function selectRoute(route) { if (!Object.prototype.hasOwnProperty.call(routeOptions.value, route)) return; selectMapRoute(route); form.value.route = route; submitRunRoute.value = route; showRouteOptions.value = false; }

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const res = await submitRunApi({ distance: form.value.distance, route: form.value.route, runTime: userDuration.value || Math.floor(predictedRunTime.value) });
    if (!res.ok) { showMessage(res.data?.msg || res.error?.message || '提交失败', 'error'); return; }
    showMessage(res.data?.response?.resultDesc || '提交成功', 'success'); emit('submitted');
  } finally { submitting.value = false; awaitingSubmitConfirm.value = false; }
};

const requestSubmitConfirm = () => { if (!isFormValid.value) { showMessage('请检查跑步数据', 'error'); return; } awaitingSubmitConfirm.value = true; };
const cancelSubmitConfirm = () => { awaitingSubmitConfirm.value = false; };
const confirmSubmit = () => { if (!awaitingSubmitConfirm.value || submitting.value) return; handleSubmit(); };
const onFormSubmit = () => { if (activeTab.value !== 'submit' || submitting.value) return; requestSubmitConfirm(); };
const onAutoConfigSaved = () => showMessage('保存成功', 'success');

onMounted(async () => { await waitForAutorunPingReady(); mapRenderUnlocked.value = true; });

loadMaps().then(async () => {
  if (submitRunRoute.value) form.value.route = submitRunRoute.value; else if (selectedRoute.value) form.value.route = selectedRoute.value;
  const cached = Number(submitRunDistance.value);
  if (Number.isInteger(cached) && cached > 0) form.value.distance = cached; else await onRandomFill();
});
</script>

<style scoped>
.drop-enter-active, .drop-leave-active { transition: all 0.2s var(--ease); }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
.swap-enter-active, .swap-leave-active { transition: opacity 0.12s var(--ease); }
.swap-enter-from, .swap-leave-to { opacity: 0; }
</style>
