import { ref, computed, onMounted, onUnmounted } from 'vue'

const OBSERVATIONS = [
  { id: 'obs_wood_dry', name: '干燥木材', description: '发现完全干燥的木材燃烧更旺，能提供更多热量。', category: 'recipe', unlockRecipe: 'warm_fire' },
  { id: 'obs_hide_soft', name: '柔软兽皮', description: '将兽皮反复揉搓后变得柔软保暖，可以制作保暖披风。', category: 'recipe', unlockRecipe: 'warm_cloak' },
  { id: 'obs_snow_shelter', name: '雪堆结构', description: '观察到压实的雪块有很好的隔热效果，可建造雪屋。', category: 'recipe', unlockRecipe: 'snow_shelter' },
  { id: 'obs_trap_logic', name: '动物踪迹', description: '通过分析动物足迹，可以设置更高效的陷阱。', category: 'recipe', unlockRecipe: 'hunting_trap' },
  { id: 'obs_tools_sharpen', name: '锋利边缘', description: '将工具在石头上打磨后更锋利，狩猎效率大幅提升。', category: 'recipe', unlockRecipe: 'sharp_tools' },
  { id: 'obs_cloud_pattern', name: '云层规律', description: '特定的云层形态预示着暴风雪即将来临。', category: 'weather', unlockWeather: 1 },
  { id: 'obs_wind_direction', name: '风向变化', description: '北风突然增强往往伴随着极端天气。', category: 'weather', unlockWeather: 2 },
  { id: 'obs_temperature_drop', name: '气温骤降', description: '温度异常下降是恶劣天气的前兆。', category: 'weather', unlockWeather: 3 },
  { id: 'obs_animal_behavior', name: '动物异常', description: '动物躁动不安地寻找庇护所，预示天气变化。', category: 'weather', unlockWeather: 4 },
  { id: 'obs_star_pattern', name: '星光闪烁', description: '夜晚星光异常明亮，次日可能有暴风雪。', category: 'weather', unlockWeather: 5 },
  { id: 'obs_secret_path', name: '隐秘小径', description: '发现了一条隐藏的林间小径，可以探索更多区域。', category: 'action', unlockAction: 'explore' },
  { id: 'obs_ice_fishing', name: '冰下鱼群', description: '厚冰之下似乎有鱼群活动，可以尝试冰钓。', category: 'action', unlockAction: 'ice_fishing' },
  { id: 'obs_herb_knowledge', name: '药草知识', description: '识别出几种可食用的耐寒植物。', category: 'action', unlockAction: 'gather_herbs' },
  { id: 'obs_trade_secret', name: '补给点', description: '发现了一个废弃的补给箱，或许有有用的物资。', category: 'action', unlockAction: 'search_supply' },
  { id: 'obs_night_vision', name: '夜视适应', description: '眼睛逐渐适应了黑暗，夜晚可以进行简单活动。', category: 'action', unlockAction: 'night_patrol' }
]

const RECIPES = {
  warm_fire: { id: 'warm_fire', name: '高效火堆', description: '使用干燥木材技术，生火获得更多热量', cost: { wood: 4 }, effect: '生火额外+15热量', icon: '🔥' },
  warm_cloak: { id: 'warm_cloak', name: '保暖披风', description: '用兽皮制作保暖披风，减少体温消耗', cost: { hide: 3, tools: 1 }, effect: '永久减少夜间热量消耗20%', icon: '🧥' },
  snow_shelter: { id: 'snow_shelter', name: '雪屋', description: '建造雪屋提供庇护，暴风雪时减少消耗', cost: { wood: 5, hide: 2 }, effect: '暴风雪时消耗减少40%', icon: '🏠' },
  hunting_trap: { id: 'hunting_trap', name: '捕猎陷阱', description: '制作被动陷阱，每天自动获取食物', cost: { wood: 3, tools: 2 }, effect: '每天早晨自动获得1-2食物', icon: '🪤' },
  sharp_tools: { id: 'sharp_tools', name: '锋利工具', description: '打磨工具，提升狩猎成功率', cost: { tools: 1, wood: 1 }, effect: '狩猎成功率+20%', icon: '⚔️' }
}

const HIDDEN_ACTIONS = {
  explore: { id: 'explore', name: '探索', description: '走隐秘小径探索未知区域', tempCost: 10, icon: '🧭' },
  ice_fishing: { id: 'ice_fishing', name: '冰钓', description: '在结冰的湖面钓鱼获取食物', tempCost: 7, icon: '🎣' },
  gather_herbs: { id: 'gather_herbs', name: '采药', description: '采集耐寒植物补充食物', tempCost: 4, icon: '🌿' },
  search_supply: { id: 'search_supply', name: '搜索补给', description: '搜索废弃补给点获取物资', tempCost: 6, icon: '📦' },
  night_patrol: { id: 'night_patrol', name: '夜间巡逻', description: '夜晚巡视营地收集见闻', tempCost: 3, icon: '🌙' }
}

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const observations = ref([])
  const unlockedRecipes = ref([])
  const weatherKnowledge = ref(0)
  const unlockedActions = ref([])
  const hasWarmCloak = ref(false)
  const hasSnowShelter = ref(false)
  const hasHuntingTrap = ref(false)
  const hasSharpTools = ref(false)
  const nextDayBlizzardChance = ref(null)

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const BASE_HEAT_CONSUMPTION_RATE = 2
  const BLIZZARD_CHANCE = 0.15

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30)
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const huntSuccessRate = computed(() => {
    let base = 0.3 + tools.value * 0.15
    if (hasSharpTools.value) base += 0.2
    return Math.min(0.95, base)
  })

  const availableObservations = computed(() => {
    return OBSERVATIONS.filter(o => !observations.value.find(v => v.id === o.id))
  })

  const unlockedRecipeDetails = computed(() => {
    return unlockedRecipes.value.map(id => RECIPES[id]).filter(Boolean)
  })

  const unlockedActionDetails = computed(() => {
    return unlockedActions.value.map(id => HIDDEN_ACTIONS[id]).filter(Boolean)
  })

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    actionLog.value.unshift({ message, type, timestamp })
    if (actionLog.value.length > 20) {
      actionLog.value.pop()
    }
  }

  function addObservation(obs) {
    if (observations.value.find(o => o.id === obs.id)) return
    observations.value.push(obs)
    addLog(`📖 新见闻：${obs.name} - ${obs.description}`, 'success')

    if (obs.unlockRecipe && !unlockedRecipes.value.includes(obs.unlockRecipe)) {
      unlockedRecipes.value.push(obs.unlockRecipe)
      addLog(`🔓 解锁配方：${RECIPES[obs.unlockRecipe].name}！`, 'success')
    }

    if (obs.unlockWeather && obs.unlockWeather > weatherKnowledge.value) {
      weatherKnowledge.value = obs.unlockWeather
      addLog(`🌤️ 天气认知提升至 Lv.${obs.unlockWeather}`, 'success')
    }

    if (obs.unlockAction && !unlockedActions.value.includes(obs.unlockAction)) {
      unlockedActions.value.push(obs.unlockAction)
      addLog(`✨ 解锁隐藏行动：${HIDDEN_ACTIONS[obs.unlockAction].name}！`, 'success')
    }
  }

  function tryTriggerObservation(actionType) {
    const chanceMap = {
      chop: 0.15,
      hunt: 0.2,
      craft: 0.1,
      fire: 0.08,
      eat: 0.05,
      explore: 0.35,
      ice_fishing: 0.25,
      gather_herbs: 0.25,
      search_supply: 0.3,
      night_patrol: 0.4
    }
    const chance = chanceMap[actionType] || 0.1

    if (availableObservations.value.length > 0 && Math.random() < chance) {
      const categoryPool = availableObservations.value.filter(o => {
        if (actionType === 'chop' || actionType === 'fire') return o.category === 'recipe' || o.category === 'weather'
        if (actionType === 'hunt') return o.category === 'recipe' || o.category === 'action'
        if (actionType === 'explore' || actionType === 'search_supply' || actionType === 'night_patrol') return o.category === 'action' || o.category === 'weather'
        if (actionType === 'ice_fishing' || actionType === 'gather_herbs') return o.category === 'recipe' || o.category === 'action'
        return true
      })
      const pool = categoryPool.length > 0 ? categoryPool : availableObservations.value
      const randomObs = pool[Math.floor(Math.random() * pool.length)]
      addObservation(randomObs)
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      addLog('游戏结束：体温过低！', 'danger')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return

    let multiplier = isBlizzard.value ? 2 : 1
    if (hasWarmCloak.value) multiplier *= 0.8
    if (hasSnowShelter.value && isBlizzard.value) multiplier *= 0.6

    const consumption = BASE_HEAT_CONSUMPTION_RATE * multiplier

    if (heat.value >= consumption) {
      heat.value -= consumption
      if (temperature.value < 80) {
        temperature.value = Math.min(80, temperature.value + 1)
      }
    } else {
      heat.value = 0
      temperature.value = Math.max(0, temperature.value - consumption)
      addLog('热量不足！体温正在下降...', 'warning')
    }

    checkGameOver()
  }

  function predictWeather() {
    if (weatherKnowledge.value >= 1) {
      nextDayBlizzardChance.value = BLIZZARD_CHANCE
    }
    if (weatherKnowledge.value >= 3 && Math.random() < 0.5 + weatherKnowledge.value * 0.1) {
      const willBlizzard = Math.random() < BLIZZARD_CHANCE
      nextDayBlizzardChance.value = willBlizzard ? 0.8 : 0.05
      addLog(willBlizzard ? '🌨️ 观察到异常迹象：今晚很可能有暴风雪！' : '☀️ 观察天象：今晚天气应该比较平稳', 'info')
    }
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)

    predictWeather()

    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
    nextDayBlizzardChance.value = null
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    isBlizzard.value = false
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }

    if (hasHuntingTrap.value) {
      const trapFood = Math.floor(Math.random() * 2) + 1
      food.value += trapFood
      addLog(`🪤 陷阱捕获了 ${trapFood} 食物`, 'success')
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    addLog('⚠️ 暴风雪来袭！所有消耗加倍！', 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 5 * multiplier

    temperature.value = Math.max(0, temperature.value - tempCost)
    const woodGained = Math.floor(Math.random() * 3) + 2
    wood.value += woodGained

    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温`, 'action')
    tryTriggerObservation('chop')

    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }

    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 8 * multiplier

    temperature.value = Math.max(0, temperature.value - tempCost)

    if (Math.random() < huntSuccessRate.value) {
      const foodGained = Math.floor(Math.random() * 3) + 2
      const hideGained = Math.floor(Math.random() * 2) + 1
      food.value += foodGained
      hide.value += hideGained
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温`, 'success')
    } else {
      addLog(`狩猎失败：消耗 ${tempCost} 体温，空手而归`, 'warning')
    }

    tryTriggerObservation('hunt')

    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }

    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier

    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    temperature.value = Math.max(0, temperature.value - tempCost)

    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温`, 'success')
    tryTriggerObservation('craft')
    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }

    wood.value -= 3
    let heatGained = Math.floor(Math.random() * 20) + 25
    if (unlockedRecipes.value.includes('warm_fire')) {
      heatGained += 15
    }
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)

    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
    tryTriggerObservation('fire')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }

    food.value -= 1
    const tempGained = Math.floor(Math.random() * 10) + 5
    temperature.value = Math.min(100, temperature.value + tempGained)

    addLog(`进食：体温恢复 ${tempGained}`, 'success')
    tryTriggerObservation('eat')
  }

  function craftRecipe(recipeId) {
    if (gameOver.value) return
    const recipe = RECIPES[recipeId]
    if (!recipe) return

    if (recipeId === 'warm_cloak' && hasWarmCloak.value) {
      addLog('已经制作过保暖披风了', 'warning')
      return
    }
    if (recipeId === 'snow_shelter' && hasSnowShelter.value) {
      addLog('已经建造过雪屋了', 'warning')
      return
    }
    if (recipeId === 'hunting_trap' && hasHuntingTrap.value) {
      addLog('已经制作过捕猎陷阱了', 'warning')
      return
    }
    if (recipeId === 'sharp_tools' && hasSharpTools.value) {
      addLog('已经打磨过工具了', 'warning')
      return
    }

    for (const [resource, amount] of Object.entries(recipe.cost)) {
      if ((resource === 'wood' && wood.value < amount) ||
          (resource === 'hide' && hide.value < amount) ||
          (resource === 'tools' && tools.value < amount) ||
          (resource === 'food' && food.value < amount)) {
        addLog(`材料不足：${recipe.name} 需要更多资源`, 'warning')
        return
      }
    }

    for (const [resource, amount] of Object.entries(recipe.cost)) {
      if (resource === 'wood') wood.value -= amount
      if (resource === 'hide') hide.value -= amount
      if (resource === 'tools') tools.value -= amount
      if (resource === 'food') food.value -= amount
    }

    const multiplier = isBlizzard.value ? 2 : 1
    temperature.value = Math.max(0, temperature.value - 5 * multiplier)

    if (recipeId === 'warm_cloak') hasWarmCloak.value = true
    if (recipeId === 'snow_shelter') hasSnowShelter.value = true
    if (recipeId === 'hunting_trap') hasHuntingTrap.value = true
    if (recipeId === 'sharp_tools') hasSharpTools.value = true

    addLog(`制作成功：${recipe.name}！${recipe.effect}`, 'success')
    checkGameOver()
  }

  function doExplore() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 10 * multiplier
    temperature.value = Math.max(0, temperature.value - tempCost)

    const rand = Math.random()
    if (rand < 0.3) {
      const woodFound = Math.floor(Math.random() * 4) + 2
      wood.value += woodFound
      addLog(`探索发现：获得 ${woodFound} 木头`, 'success')
    } else if (rand < 0.55) {
      const foodFound = Math.floor(Math.random() * 2) + 1
      food.value += foodFound
      addLog(`探索发现：获得 ${foodFound} 食物`, 'success')
    } else if (rand < 0.75) {
      const hideFound = Math.floor(Math.random() * 2) + 1
      hide.value += hideFound
      addLog(`探索发现：获得 ${hideFound} 兽皮`, 'success')
    } else if (rand < 0.9) {
      tools.value += 1
      addLog('探索发现：获得 1 工具', 'success')
    } else {
      addLog('探索未发现任何有用的东西', 'warning')
    }

    tryTriggerObservation('explore')
    checkGameOver()
  }

  function doIceFishing() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 7 * multiplier
    temperature.value = Math.max(0, temperature.value - tempCost)

    if (Math.random() < 0.6) {
      const fish = Math.floor(Math.random() * 3) + 1
      food.value += fish
      addLog(`冰钓成功：获得 ${fish} 食物`, 'success')
    } else {
      addLog('冰钓失败：鱼儿没有上钩', 'warning')
    }

    tryTriggerObservation('ice_fishing')
    checkGameOver()
  }

  function doGatherHerbs() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 4 * multiplier
    temperature.value = Math.max(0, temperature.value - tempCost)

    const herbs = Math.floor(Math.random() * 2) + 1
    food.value += herbs
    addLog(`采药：获得 ${herbs} 食物（药草）`, 'success')

    tryTriggerObservation('gather_herbs')
    checkGameOver()
  }

  function doSearchSupply() {
    if (gameOver.value || isNight.value) return

    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier
    temperature.value = Math.max(0, temperature.value - tempCost)

    const rand = Math.random()
    if (rand < 0.25) {
      food.value += 3
      wood.value += 2
      addLog('补给搜索：获得 3 食物和 2 木头', 'success')
    } else if (rand < 0.5) {
      tools.value += 1
      hide.value += 1
      addLog('补给搜索：获得 1 工具和 1 兽皮', 'success')
    } else if (rand < 0.75) {
      heat.value = Math.min(100, heat.value + 20)
      addLog('补给搜索：找到一些可燃物，热量+20', 'success')
    } else {
      addLog('补给点已被搜刮一空', 'warning')
    }

    tryTriggerObservation('search_supply')
    checkGameOver()
  }

  function doNightPatrol() {
    if (gameOver.value || isDay.value) return

    const tempCost = 3
    temperature.value = Math.max(0, temperature.value - tempCost)

    if (Math.random() < 0.5) {
      const woodFound = Math.floor(Math.random() * 2) + 1
      wood.value += woodFound
      addLog(`夜间巡逻：拾到 ${woodFound} 漂流木`, 'success')
    } else {
      addLog('夜间巡逻：四周一片寂静', 'info')
    }

    tryTriggerObservation('night_patrol')
    checkGameOver()
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)

    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      observations: observations.value.map(o => o.id),
      unlockedRecipes: unlockedRecipes.value,
      weatherKnowledge: weatherKnowledge.value,
      unlockedActions: unlockedActions.value,
      hasWarmCloak: hasWarmCloak.value,
      hasSnowShelter: hasSnowShelter.value,
      hasHuntingTrap: hasHuntingTrap.value,
      hasSharpTools: hasSharpTools.value,
      savedAt: Date.now()
    }
    localStorage.setItem(`snowSurvival_${slot}`, JSON.stringify(gameState))
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      addLog('没有找到存档', 'warning')
      return false
    }

    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature
      heat.value = gameState.heat
      wood.value = gameState.wood
      food.value = gameState.food
      hide.value = gameState.hide
      tools.value = gameState.tools
      isDay.value = gameState.isDay
      dayCount.value = gameState.dayCount
      isBlizzard.value = gameState.isBlizzard

      observations.value = (gameState.observations || []).map(id => OBSERVATIONS.find(o => o.id === id)).filter(Boolean)
      unlockedRecipes.value = gameState.unlockedRecipes || []
      weatherKnowledge.value = gameState.weatherKnowledge || 0
      unlockedActions.value = gameState.unlockedActions || []
      hasWarmCloak.value = gameState.hasWarmCloak || false
      hasSnowShelter.value = gameState.hasSnowShelter || false
      hasHuntingTrap.value = gameState.hasHuntingTrap || false
      hasSharpTools.value = gameState.hasSharpTools || false

      gameOver.value = false
      gameOverReason.value = ''
      actionLog.value = []

      stopTimers()
      startTimers()

      if (!isDay.value) {
        startNightCycle()
      }

      addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  function getSaveSlots() {
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const data = JSON.parse(localStorage.getItem(key))
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt
          })
        } catch (e) {}
      }
    }
    return slots
  }

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    addLog(`已删除存档：${slot}`, 'info')
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []
    observations.value = []
    unlockedRecipes.value = []
    weatherKnowledge.value = 0
    unlockedActions.value = []
    hasWarmCloak.value = false
    hasSnowShelter.value = false
    hasHuntingTrap.value = false
    hasSharpTools.value = false
    nextDayBlizzardChance.value = null

    stopTimers()
    startTimers()

    addLog('新游戏开始！祝你好运！', 'success')
  }

  onMounted(() => {
    startTimers()
    addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。探索更多以发现隐藏见闻！', 'info')
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    gameOver,
    gameOverReason,
    actionLog,
    isDanger,
    canMakeFire,
    canHunt,
    huntSuccessRate,
    observations,
    unlockedRecipes,
    unlockedRecipeDetails,
    weatherKnowledge,
    unlockedActions,
    unlockedActionDetails,
    hasWarmCloak,
    hasSnowShelter,
    hasHuntingTrap,
    hasSharpTools,
    nextDayBlizzardChance,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    craftRecipe,
    doExplore,
    doIceFishing,
    doGatherHerbs,
    doSearchSupply,
    doNightPatrol,
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    restartGame
  }
}
