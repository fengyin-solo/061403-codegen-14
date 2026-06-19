<template>
  <div class="action-panel">
    <h3 class="panel-title">行动</h3>
    <div v-if="isNight && !canNightPatrol" class="night-warning">
      <span>🌙 夜晚无法外出活动，请保持温暖！</span>
    </div>
    <div class="actions-grid">
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver }"
        @click="$emit('chop')"
      >
        <span class="btn-icon">🪓</span>
        <span class="btn-text">砍柴</span>
        <span class="btn-cost">-5 体温</span>
      </button>
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver }"
        @click="$emit('hunt')"
      >
        <span class="btn-icon">🏹</span>
        <span class="btn-text">狩猎</span>
        <span class="btn-cost">-8 体温</span>
        <span class="btn-hint">成功率: {{ Math.round(huntRate * 100) }}%</span>
      </button>
      <button 
        class="action-btn" 
        :class="{ disabled: isNight || gameOver || !canCraft }"
        @click="$emit('craft')"
      >
        <span class="btn-icon">🔨</span>
        <span class="btn-text">制作工具</span>
        <span class="btn-cost">-6 体温</span>
        <span class="btn-hint">需要: 2🪵 + 1🦊</span>
      </button>
      <button 
        class="action-btn fire-btn" 
        :class="{ disabled: !canFire || gameOver }"
        @click="$emit('fire')"
      >
        <span class="btn-icon">🔥</span>
        <span class="btn-text">生火</span>
        <span class="btn-cost">-3 木头</span>
        <span class="btn-hint">+25~45 热量</span>
      </button>
      <button 
        class="action-btn food-btn" 
        :class="{ disabled: food <= 0 || gameOver }"
        @click="$emit('eat')"
      >
        <span class="btn-icon">🍖</span>
        <span class="btn-text">进食</span>
        <span class="btn-cost">-1 食物</span>
        <span class="btn-hint">+5~15 体温</span>
      </button>
    </div>

    <div v-if="unlockedActionDetails.length > 0" class="hidden-section">
      <h4 class="section-title">✨ 隐藏行动</h4>
      <div class="actions-grid">
        <button 
          v-for="action in unlockedActionDetails" 
          :key="action.id"
          class="action-btn hidden-btn"
          :class="{ 
            disabled: (action.id !== 'night_patrol' && isNight) || (action.id === 'night_patrol' && isDay) || gameOver 
          }"
          @click="$emit(action.id)"
        >
          <span class="btn-icon">{{ action.icon }}</span>
          <span class="btn-text">{{ action.name }}</span>
          <span class="btn-cost">-{{ action.tempCost }} 体温</span>
          <span class="btn-hint">{{ action.description }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isNight: { type: Boolean, default: false },
  gameOver: { type: Boolean, default: false },
  canFire: { type: Boolean, default: false },
  canCraft: { type: Boolean, default: false },
  huntRate: { type: Number, default: 0.3 },
  food: { type: Number, default: 0 },
  unlockedActionDetails: { type: Array, default: () => [] }
})

defineEmits(['chop', 'hunt', 'craft', 'fire', 'eat', 'explore', 'ice_fishing', 'gather_herbs', 'search_supply', 'night_patrol'])

const canNightPatrol = computed(() => {
  return props.unlockedActionDetails.some(a => a.id === 'night_patrol')
})
</script>

<style scoped>
.action-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  color: white;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.night-warning {
  background: rgba(50, 50, 100, 0.8);
  border: 1px solid rgba(100, 100, 200, 0.5);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 15px;
  text-align: center;
  color: #a0c4ff;
  font-size: 14px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.hidden-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
}

.section-title {
  color: #d2b4de;
  font-size: 14px;
  margin-bottom: 12px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 15px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.action-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.action-btn:active:not(.disabled) {
  transform: translateY(-1px);
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.fire-btn:not(.disabled) {
  border-color: rgba(255, 100, 50, 0.6);
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.3), rgba(255, 50, 0, 0.1));
}

.fire-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(255, 100, 50, 0.4);
}

.food-btn:not(.disabled) {
  border-color: rgba(50, 200, 100, 0.6);
  background: linear-gradient(135deg, rgba(50, 200, 100, 0.3), rgba(0, 150, 50, 0.1));
}

.food-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(50, 200, 100, 0.4);
}

.hidden-btn:not(.disabled) {
  border-color: rgba(155, 89, 182, 0.6);
  background: linear-gradient(135deg, rgba(155, 89, 182, 0.3), rgba(142, 68, 173, 0.1));
}

.hidden-btn:hover:not(.disabled) {
  box-shadow: 0 5px 20px rgba(155, 89, 182, 0.4);
}

.btn-icon {
  font-size: 28px;
}

.btn-text {
  font-size: 14px;
  font-weight: bold;
}

.btn-cost {
  font-size: 11px;
  color: rgba(255, 150, 150, 0.9);
}

.btn-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.3;
}
</style>
