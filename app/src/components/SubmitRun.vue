<template>
  <div class="flex-1 flex flex-col min-h-0 relative w-full">
    
    <!-- Stats Card -->
    <div class="card p-5 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-headline" style="color: var(--text-primary)">完成情况</h3>
        <span class="text-caption" style="color: var(--text-tertiary)">
          {{ stats.semesterEndDateText }}
        </span>
      </div>
      
      <div class="grid grid-cols-3 gap-3">
        <div v-for="card in summaryCards" :key="card.label" 
             class="text-center p-3 rounded-xl"
             style="background: var(--accent-subtle)">
          <div class="text-headline" style="color: var(--accent)">{{ card.value }}</div>
          <div class="text-caption font-medium mt-1" style="color: var(--text-primary)">{{ card.label }}</div>
          <div class="text-caption mt-0.5" style="color: var(--text-tertiary)">{{ card.detail }}</div>
        </div>
      </div>
    </div>
    
    <!-- Main Form -->
    <form @submit.prevent="onFormSubmit" class="flex-1 flex flex-col min-h-0">
      <div class="card p-5 mb-4">
        
        <!-- Tabs -->
        <div class="flex gap-1 p-1 rounded-xl mb-5" style="background: var(--bg-tertiary)">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            @click="activeTab = tab.key"
            class="flex-1 py-2.5 px-4 rounded-lg text-callout font-medium transition-all"
            :style="{
              background: activeTab === tab.key ? 'var(--card-bg)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key ? 'var(--card-shadow)' : 'none'
            }"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <!-- Submit Tab -->
        <div v-show="activeTab === 'submit'" class="space-y-4">
          
          <!-- Map Selector -->
          <div>
            <label class="block text-caption font-medium mb-2" style="color: var(--text-secondary)">
              选择路线
            </label>
            <div class="relative">
              <button
                type="button"
                @click="mapsLoaded && !submitting ? (showRouteOptions = !showRouteOptions) : null"
                class="input-field flex items-center justify-between w-full"
                :style="{ opacity: (!mapsLoaded || submitting) ? 0.6 : 1 }"
              >
                <span>{{ mapsLoaded ? getRouteName(form.route) : '加载中...' }}</span>
                <svg class="w-4 h-4 transition-transform" :style="{ transform: showRouteOptions ? 'rotate(180deg)' : 'rotate(0)' }" 
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              <!-- Dropdown -->
              <transition name="dropdown">
                <div v-if="showRouteOptions && mapsLoaded"
                     class="absolute left-0 right-0 top-full mt-1 card py-1 z-50"
                     style="max-height: 200px; overflow-y: auto">
                  <button
                    v-for="(name, value) in routeOptions"
                    :key="value"
                    type="button"
                    class="w-full px-4 py-2.5 text-left text-callout transition-colors"
                    :style="{
                      color: form.route === value ? 'var(--accent)' : 'var(--text-primary)',
                      background: form.route === value ? 'var(--accent-subtle)' : 'transparent'
                    }"
                    @click.stop="selectRoute(value)"
                  >
                    {{ name }}
                  </button>
                </div>
              </transition>
            </div>
          </div>
          
          <!-- Distance & Duration -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-caption font-medium" style="color: var(--text-secondary)">
                跑步数据
              </label>
              <span class="text-caption" style="color: var(--text-tertiary)">
                配速 {{ paceDisplay }}
              </span>
            </div>
            
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <input
                  v-model.number="form.distance"
                  type="number"
                  step="1"
                  placeholder="距离"
                  required
                  class="input-field pr-10"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-caption" style="color: var(--text-tertiary)">
                  米
                </span>
              </div>
              
              <div class="flex-1 relative">
                <input
                  v-model.number="form.duration"
                  type="number"
                  placeholder="时间"
                  class="input-field pr-10"
                  :class="{ 'opacity-50': !userTyping }"
                  @focus="userTyping = true"
                  @blur="onDurationBlur"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-caption" style="color: var(--text-tertiary)">
                  分
                </span>
              </div>
              
              <button
                type="button"
                @click="onRandomFill"
                :disabled="submitting || randomizing"
                class="btn btn-ghost px-4"
                style="background: var(--btn-secondary-bg)"
              >
                <svg v-if="!randomizing" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <circle cx="12" cy="12" r="1"/>
                </svg>
                <div v-else class="spinner"></div>
              </button>
            </div>
          </div>
          
          <!-- Submit Button -->
          <div class="pt-2">
            <transition name="fade" mode="out-in">
              <button
                v-if="!awaitingSubmitConfirm"
                key="submit"
                type="submit"
                class="btn btn-primary w-full"
                :disabled="submitting || !isFormValid"
              >
                提交记录
              </button>
              
              <div v-else key="confirm" class="flex gap-3">
                <button
                  type="button"
                  class="btn btn-ghost flex-1"
                  style="background: var(--btn-secondary-bg)"
                  :disabled="submitting"
                  @click="cancelSubmitConfirm"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-accent flex-1"
                  :disabled="submitting || !isFormValid"
                  @click="confirmSubmit"
                >
                  <div v-if="submitting" class="spinner"></div>
                  <span v-else>确认提交</span>
                </button>
              </div>
            </transition>
          </div>
          
        </div>
        
        <!-- Schedule Tab -->
        <div v-show="activeTab === 'schedule'">
          <div v-if="schedulePanelMounted">
            <AutoConfig inline @saved="onAutoConfigSaved" />
          </div>
        </div>
        
      </div>
    </form>
    
    <!-- Map Preview -->
    <div v-show="activeTab === 'submit'" class="card p-5">
      <h3 class="text-callout font-medium mb-3" style="color: var(--text-secondary)">路线预览</h3>
      <MapPreview
        v-if="mapRenderUnlocked"
        :track="generatedTrack"
        :ready="mapReady"
        :map-style="isDark ? 'dark' : 'light'"
        class="w-full"
      />
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, defineAsyncComponent, onMounted } from 'vue';
import { submitRun as submitRunApi, useRouteGenerator } from '@/composables/useRun';
import { useDataStore } from '@/composables/useDataStore';
import { useThemeStore } from '@/composables/useTheme';
import { waitForAutorunPingReady } from '@/sdk/autorun';
import {
  calculatePaceMinutesPerKm,
  computeDurationFromDistance,
  formatPaceMinutesPerKm,
  normalizeRoundedRunTime,
  randomIntNonThousand,
  resolveRunBoundsFromStandard,
  isPaceWithinLimits,
} from '@/utils/run';

const MapPreview = defineAsyncComponent(() => import('./MapPreview.vue'));
const AutoConfig = defineAsyncComponent(() => import('./AutoConfig.vue'));

const showMessage = inject('showMessage');

const { userInfo, runStandard, runInfo, activityInfo, submitRunDistance, submitRunRoute } =
  useDataStore();

const emit = defineEmits(['submitted']);

const tabs = [
  { key: 'submit', label: '手动提交' },
  { key: 'schedule', label: '自动提交' },
];

const activeTab = ref('submit');
const schedulePanelMounted = ref(false);

watch(activeTab, (tab) => {
  if (tab === 'schedule') schedulePanelMounted.value = true;
}, { immediate: true });

// Form state
const form = ref({
  distance: submitRunDistance.value,
  route: submitRunRoute.value,
  duration: 0,
});

const mapRenderUnlocked = ref(false);
const submitting = ref(false);
const randomizing = ref(false);
const awaitingSubmitConfirm = ref(false);
const showRouteOptions = ref(false);

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.isDark);

const distanceBounds = computed(() =>
  resolveRunBoundsFromStandard(userInfo.value || {}, runStandard.value || {})
);

const isDistanceValid = computed(() => {
  const distance = Number(form.value.distance);
  return Number.isInteger(distance) && distance > 0;
});

const isPaceValid = computed(() => {
  const distance = Number(form.value.distance);
  const time = userDuration.value || Math.floor(predictedRunTime.value);
  if (!distance || !time) return false;
  return isPaceWithinLimits(distance, time);
});

const isFormValid = computed(() => isDistanceValid.value && isPaceValid.value);

const distanceErrorText = computed(() => {
  if (!isDistanceValid.value) return '跑步里程需为大于 0 的整数';
  if (!isPaceValid.value) return '配速不合理，请控制在 4.0 - 10.0 km/h 之间';
  return '';
});

const predictedRunTime = ref(0);

const calculatePredictedRunTime = (distance) => {
  if (!Number.isInteger(distance) || distance <= 0) return 0;
  const rawDuration = computeDurationFromDistance(distance, {
    minMinutes: distanceBounds.value.timeMin,
    maxMinutes: distanceBounds.value.timeMax,
  });
  return normalizeRoundedRunTime(rawDuration, distance, {
    minMinutes: distanceBounds.value.timeMin,
    maxMinutes: distanceBounds.value.timeMax,
  });
};

const userTyping = ref(false);

watch(() => Number(form.value.distance), (distance) => {
  if (!userTyping.value) {
    const time = calculatePredictedRunTime(distance);
    predictedRunTime.value = time;
    form.value.duration = Math.floor(time);
  }
}, { immediate: true });

watch(() => form.value.duration, (duration) => {
  if (!userTyping.value) return;
  if (duration > 0) predictedRunTime.value = 0;
});

const userDuration = computed(() => {
  const d = Number(form.value.duration);
  return Number.isInteger(d) && d > 0 ? d : 0;
});

const paceDisplay = computed(() => {
  const distance = Number(form.value.distance);
  const time = userDuration.value || Math.floor(predictedRunTime.value);
  if (!Number.isInteger(distance) || distance <= 0 || !time) return "0'00''/km";
  return formatPaceMinutesPerKm(distance, time);
});

const buildLocalRandomRun = () => {
  const bounds = distanceBounds.value;
  const runDistance = randomIntNonThousand(bounds.distanceMin, bounds.distanceMax);
  const duration = computeDurationFromDistance(runDistance, {
    minMinutes: bounds.timeMin,
    maxMinutes: bounds.timeMax,
  });
  const runTime = normalizeRoundedRunTime(duration, runDistance, {
    minMinutes: bounds.timeMin,
    maxMinutes: bounds.timeMax,
  });
  const route = String(form.value.route || selectedRoute.value || 'default').trim() || 'default';

  return {
    map_id: route,
    run_distance: runDistance,
    run_time: runTime,
    track_points: '',
  };
};

const applyRandomRun = (randomRun) => {
  if (!randomRun) return;
  const mapId = String(randomRun.map_id || '').trim();
  if (mapId && Object.prototype.hasOwnProperty.call(routeOptions.value, mapId)) {
    selectMapRoute(mapId);
    form.value.route = mapId;
  }
  form.value.distance = randomRun.run_distance;
};

function onDurationBlur() {
  userTyping.value = false;
  if (!form.value.duration || form.value.duration <= 0) {
    const time = calculatePredictedRunTime(form.value.distance);
    predictedRunTime.value = time;
    form.value.duration = Math.floor(time);
  }
}

async function onRandomFill() {
  if (submitting.value || randomizing.value) return;
  randomizing.value = true;
  userTyping.value = false;
  try {
    const randomRun = buildLocalRandomRun();
    applyRandomRun(randomRun);
    predictedRunTime.value = randomRun.run_time || calculatePredictedRunTime(Number(form.value.distance));
    form.value.duration = Math.floor(predictedRunTime.value);
  } finally {
    randomizing.value = false;
    awaitingSubmitConfirm.value = false;
  }
}

watch(() => [form.value.distance, form.value.route], ([distance, route]) => {
  submitRunDistance.value = distance;
  submitRunRoute.value = route;
  awaitingSubmitConfirm.value = false;
});

const {
  mapsLoaded,
  routeOptions,
  selectedRoute,
  load: loadMaps,
  selectRoute: selectMapRoute,
  getRouteName,
  generatedTrack,
  mapReady,
} = useRouteGenerator(
  computed(() => form.value.distance),
  computed(() => form.value.route)
);

// Stats
const stats = computed(() => {
  const activity = activityInfo.value || {};
  const run = runInfo.value || {};
  const standard = runStandard.value || {};
  const user = userInfo.value || {};

  const completedActivities = Number(activity.joinNum || 0);
  const totalActivities = Number(activity.totalNum || 0);
  const clubCompletionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
  const clubCompletionRateText = totalActivities === 0 ? '0%' : `${Math.round(clubCompletionRate)}%`;

  const totalRequiredRuns = user.gender === '1'
    ? Number(standard.boyAllRunTime || 0)
    : user.gender === '2'
      ? Number(standard.girlAllRunTime || 0)
      : 0;
  const completedRuns = Number(run.runValidCount || 0);
  const runCompletionRate = totalRequiredRuns
    ? Math.min(100, Math.round((completedRuns / totalRequiredRuns) * 100))
    : 0;

  const totalDistanceMeters = Number(run.runValidDistance || 0);
  const totalDistanceKm = (Math.floor((totalDistanceMeters / 1000) * 10) / 10).toFixed(1);
  const targetDistanceKm = user.gender === '1'
    ? (Number(standard.boyAllRunDistance || 0) / 1000).toFixed(1)
    : user.gender === '2'
      ? (Number(standard.girlAllRunDistance || 0) / 1000).toFixed(1)
      : '0.0';
  const targetDistanceNumber = Number(targetDistanceKm);
  const currentDistanceNumber = Number(totalDistanceKm);
  const distancePercentage = targetDistanceNumber
    ? Math.min(100, (currentDistanceNumber / targetDistanceNumber) * 100)
    : 0;

  const semYear = String(standard.semesterYear || '');
  const semesterFlag = semYear.slice(-1);
  const semesterEndDateText = semesterFlag === '1'
    ? standard.firstSemesterDateEnd || ''
    : semesterFlag === '2'
      ? standard.secondSemesterDateEnd || ''
      : '';

  return {
    semesterEndDateText,
    summaryCards: [
      { label: '俱乐部', value: clubCompletionRateText, detail: `${completedActivities}/${totalActivities}` },
      { label: '跑步次数', value: `${runCompletionRate}%`, detail: `${completedRuns}/${totalRequiredRuns}` },
      { label: '跑步里程', value: `${Math.round(distancePercentage)}%`, detail: `${totalDistanceKm}/${targetDistanceNumber > 0 ? targetDistanceKm : '0'}` },
    ],
  };
});

const summaryCards = computed(() => stats.value.summaryCards);

function selectRoute(route) {
  if (!Object.prototype.hasOwnProperty.call(routeOptions.value, route)) return;
  selectMapRoute(route);
  form.value.route = route;
  submitRunRoute.value = route;
  showRouteOptions.value = false;
}

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const runTime = userDuration.value || Math.floor(predictedRunTime.value);
    const res = await submitRunApi({
      distance: form.value.distance,
      route: form.value.route,
      runTime,
    });
    
    if (!res.ok) {
      let msg = res.data?.msg || res.error?.message || '提交失败';
      if (res.msg === 'not_login') msg = '请先登录';
      else if (res.msg === 'distance_invalid') msg = '跑步里程需为大于 0 的整数';
      else if (res.msg === 'track_invalid') msg = '轨迹生成失败，请重新随机';
      showMessage(msg, 'error');
      return;
    }

    showMessage(res.data?.response?.resultDesc || '提交成功', 'success');
    emit('submitted');
  } finally {
    submitting.value = false;
    awaitingSubmitConfirm.value = false;
  }
};

const requestSubmitConfirm = () => {
  if (!isFormValid.value) {
    showMessage(distanceErrorText.value, 'error');
    return;
  }
  awaitingSubmitConfirm.value = true;
};

const cancelSubmitConfirm = () => { awaitingSubmitConfirm.value = false; };
const confirmSubmit = () => {
  if (!awaitingSubmitConfirm.value || submitting.value) return;
  handleSubmit();
};

const onFormSubmit = () => {
  if (activeTab.value !== 'submit' || submitting.value) return;
  requestSubmitConfirm();
};

const onAutoConfigSaved = () => showMessage('保存成功', 'success');

const unlockMapRender = async () => {
  await waitForAutorunPingReady();
  mapRenderUnlocked.value = true;
};

onMounted(() => { unlockMapRender(); });

loadMaps().then(async () => {
  if (submitRunRoute.value) {
    form.value.route = submitRunRoute.value;
  } else if (selectedRoute.value) {
    form.value.route = selectedRoute.value;
  }
  const cachedDistance = Number(submitRunDistance.value);
  if (Number.isInteger(cachedDistance) && cachedDistance > 0) {
    form.value.distance = cachedDistance;
  } else {
    await onRandomFill();
  }
});
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s var(--ease-default);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s var(--ease-default);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
