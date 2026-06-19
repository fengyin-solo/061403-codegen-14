<template>
  <div class="research-panel">
    <div class="panel-header" @click="togglePanel">
      <h3 class="panel-title">📖 研究笔记</h3>
      <span class="toggle-icon">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <div v-show="expanded" class="panel-content">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ observations.length }}/15</span>
          <span class="stat-label">见闻</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📜</span>
          <span class="stat-value">{{ unlockedRecipes.length }}/5</span>
          <span class="stat-label">配方</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🌤️</span>
          <span class="stat-value">Lv.{{ weatherKnowledge }}</span>
          <span class="stat-label">天气认知</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">✨</span>
          <span class="stat-value">{{ unlockedActions.length }}/5</span>
          <span class="stat-label">隐藏行动</span>
        </div>
      </div>

      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'observations' }"
          @click="activeTab = 'observations'"
        >
          见闻记录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'recipes' }"
          @click="activeTab = 'recipes'"
        >
          配方手册
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'actions' }"
          @click="activeTab = 'actions'"
        >
          行动手册
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'observations'" class="obs-list">
          <div v-if="observations.length === 0" class="empty-state">
            还没有收集到任何见闻，多探索多行动吧！
          </div>
          <div 
            v-for="obs in observations" 
            :key="obs.id" 
            class="obs-card"
            :class="obs.category"
          >
            <div class="obs-icon">
              {{ obs.category === 'recipe' ? '📜' : obs.category === 'weather' ? '🌤️' : '✨' }}
            </div>
            <div class="obs-info">
              <div class="obs-name">{{ obs.name }}</div>
              <div class="obs-desc">{{ obs.description }}</div>
              <div class="obs-category">
                {{ obs.category === 'recipe' ? '配方类' : obs.category === 'weather' ? '天气类' : '行动类' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'recipes'" class="recipe-list">
          <div v-if="unlockedRecipeDetails.length === 0" class="empty-state">
            还没有解锁任何配方
          </div>
          <div 
            v-for="recipe in unlockedRecipeDetails" 
            :key="recipe.id" 
            class="recipe-card"
          >
            <div class="recipe-icon">{{ recipe.icon }}</div>
            <div class="recipe-info">
              <div class="recipe-name">{{ recipe.name }}</div>
              <div class="recipe-desc">{{ recipe.description }}</div>
              <div class="recipe-cost">
                材料：
                <span v-for="(amount, resource) in recipe.cost" :key="resource" class="cost-tag">
                  {{ getResourceIcon(resource) }} {{ amount }}
                </span>
              </div>
              <div class="recipe-effect">效果：{{ recipe.effect }}</div>
              <button 
                v-if="!isRecipeCrafted(recipe.id)"
                class="craft-btn"
                :class="{ disabled: !canCraftRecipe(recipe) }"
                @click="$emit('craft', recipe.id)"
              >
                制作
              </button>
              <span v-else class="crafted-tag">✓ 已制作</span>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'actions'" class="action-list">
          <div v-if="unlockedActionDetails.length === 0" class="empty-state">
            还没有解锁任何隐藏行动
          </div>
          <div 
            v-for="action in unlockedActionDetails" 
            :key="action.id" 
            class="action-card"
          >
            <div class="action-icon">{{ action.icon }}</div>
            <div class="action-info">
              <div class="action-name">{{ action.name }}</div>
              <div class="action-desc">{{ action.description }}</div>
              <div class="action-cost">消耗：-{{ action.tempCost }} 体温</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  observations: { type: Array, default: () => [] },
  unlockedRecipeDetails: { type: Array, default: () => [] },
  unlockedActionDetails: { type: Array, default: () => [] },
  unlockedRecipes: { type: Array, default: () => [] },
  unlockedActions: { type: Array, default: () => [] },
  weatherKnowledge: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  hide: { type: Number, default: 0 },
  tools: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  hasWarmCloak: { type: Boolean, default: false },
  hasSnowShelter: { type: Boolean, default: false },
  hasHuntingTrap: { type: Boolean, default: false },
  hasSharpTools: { type: Boolean, default: false }
})

defineEmits(['craft'])

const expanded = ref(true)
const activeTab = ref('observations')

function togglePanel() {
  expanded.value = !expanded.value
}

function getResourceIcon(resource) {
  const icons = { wood: '🪵', hide: '🦊', tools: '🔪', food: '🍖', heat: '🔥' }
  return icons[resource] || '📦'
}

function isRecipeCrafted(recipeId) {
  if (recipeId === 'warm_cloak') return props.hasWarmCloak
  if (recipeId === 'snow_shelter') return props.hasSnowShelter
  if (recipeId === 'hunting_trap') return props.hasHuntingTrap
  if (recipeId === 'sharp_tools') return props.hasSharpTools
  return false
}

function canCraftRecipe(recipe) {
  for (const [resource, amount] of Object.entries(recipe.cost)) {
    if (resource === 'wood' && props.wood < amount) return false
    if (resource === 'hide' && props.hide < amount) return false
    if (resource === 'tools' && props.tools < amount) return false
    if (resource === 'food' && props.food < amount) return false
  }
  return true
}
</script>

<style scoped>
.research-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.panel-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.panel-title {
  color: white;
  font-size: 18px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.toggle-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.panel-content {
  padding: 0 20px 20px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  gap: 2px;
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
}

.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
}

.tab-btn {
  flex: 1;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 12px;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  color: white;
}

.tab-btn.active {
  background: rgba(100, 150, 255, 0.3);
  border-color: rgba(100, 150, 255, 0.5);
  color: white;
}

.tab-content {
  max-height: 280px;
  overflow-y: auto;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 30px 20px;
  font-style: italic;
  font-size: 13px;
}

.obs-card,
.recipe-card,
.action-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: transform 0.2s;
}

.obs-card:hover,
.recipe-card:hover,
.action-card:hover {
  transform: translateX(3px);
}

.obs-card.recipe {
  border-left: 3px solid #f39c12;
}

.obs-card.weather {
  border-left: 3px solid #3498db;
}

.obs-card.action {
  border-left: 3px solid #9b59b6;
}

.obs-icon,
.recipe-icon,
.action-icon {
  font-size: 32px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.obs-info,
.recipe-info,
.action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.obs-name,
.recipe-name,
.action-name {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.obs-desc,
.recipe-desc,
.action-desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  line-height: 1.4;
}

.obs-category,
.recipe-cost,
.recipe-effect,
.action-cost {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.cost-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 4px;
  font-size: 11px;
}

.craft-btn {
  align-self: flex-start;
  padding: 5px 15px;
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.4), rgba(39, 174, 96, 0.2));
  border: 1px solid rgba(46, 204, 113, 0.5);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  margin-top: 5px;
}

.craft-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.6), rgba(39, 174, 96, 0.4));
  transform: translateY(-1px);
}

.craft-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.crafted-tag {
  align-self: flex-start;
  color: #2ecc71;
  font-size: 12px;
  font-weight: bold;
  margin-top: 5px;
}
</style>
