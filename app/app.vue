<script setup>
const TOTAL_BOXES = 20

const boxes = ref(Array(TOTAL_BOXES).fill(null))
const locked = ref(Array(TOTAL_BOXES).fill(false))
const currentNumber = ref(null)
const usedNumbers = ref(new Set())
const gameOver = ref(false)
const gameWon = ref(false)
const gameStarted = ref(false)
const showInfo = ref(false)
const gameOverText = ref('')
const filledCount = computed(() => locked.value.filter(Boolean).length)

const score = ref(0)
const lastPoints = ref(null)
const lastMultiplier = ref(null)
const placedAt = ref(null)
let pointsTimer = null

function getMultiplier(seconds) {
  if (seconds <= 1) return 3
  if (seconds <= 3) return 2
  if (seconds <= 8) return 1
  return 0.5
}

function getMultiplierLabel(m) {
  if (m === 3) return { label: '3x 🔥', color: '#f97316' }
  if (m === 2) return { label: '2x ⚡', color: '#facc15' }
  if (m === 1) return { label: '1x', color: '#94a3b8' }
  return { label: '0.5x', color: '#64748b' }
}

const GAME_OVER_TEXTS = [
  'Only the strong endure.',
  'You lacked the will to continue.',
  'This world devours the weak.',
  'Too weak.',
  'Learn. Adapt. Return.',
  "This isn't the end.",
  'Power was not on your side.',
]

watch([showInfo, gameOver, gameWon], ([info, over, won]) => {
  document.body.style.overflow = (info || over || won) ? 'hidden' : ''
})

function generateNumber() {
  if (!gameStarted.value) gameStarted.value = true

  let num
  do {
    num = Math.floor(Math.random() * 1000) + 1
  } while (usedNumbers.value.has(num))

  usedNumbers.value.add(num)
  currentNumber.value = num
  placedAt.value = Date.now()
}

function isValidPlacement(index, num) {
  const leftValid = boxes.value.slice(0, index).every((v, j) => !locked.value[j] || v < num)
  const rightValid = boxes.value.slice(index + 1).every((v, j) => !locked.value[index + 1 + j] || v > num)
  return leftValid && rightValid
}

function placeNumber(index) {
  if (locked.value[index] || currentNumber.value === null) return
  if (!isValidPlacement(index, currentNumber.value)) {
    gameOverText.value = GAME_OVER_TEXTS[Math.floor(Math.random() * GAME_OVER_TEXTS.length)]
    gameOver.value = true
    return
  }

  const elapsed = (Date.now() - placedAt.value) / 1000
  const multiplier = getMultiplier(elapsed)
  const points = Math.round(100 * multiplier)
  score.value += points
  lastPoints.value = points
  lastMultiplier.value = getMultiplierLabel(multiplier)

  clearTimeout(pointsTimer)
  pointsTimer = setTimeout(() => { lastPoints.value = null }, 1500)

  boxes.value[index] = currentNumber.value
  locked.value[index] = true
  currentNumber.value = null

  if (locked.value.every(Boolean)) {
    gameWon.value = true
    return
  }

  generateNumber()
  checkGameOver()
}

function checkGameOver() {
  const num = currentNumber.value
  const hasValidBox = boxes.value.some((_, i) => !locked.value[i] && isValidPlacement(i, num))

  if (!hasValidBox) {
    gameOverText.value = GAME_OVER_TEXTS[Math.floor(Math.random() * GAME_OVER_TEXTS.length)]
    gameOver.value = true
  }
}

function newGame() {
  boxes.value = Array(TOTAL_BOXES).fill(null)
  locked.value = Array(TOTAL_BOXES).fill(false)
  currentNumber.value = null
  usedNumbers.value = new Set()
  gameOver.value = false
  gameWon.value = false
  gameStarted.value = false
  score.value = 0
  lastPoints.value = null
  lastMultiplier.value = null
  placedAt.value = null
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Number Challenge</h1>
      <button class="btn-info" @click="showInfo = true">ℹ️</button>
    </div>

    <div class="meta-row">
      <div class="stage">Stage {{ filledCount }}/{{ TOTAL_BOXES }}</div>
      <div class="score">
        Score: <strong>{{ score }}</strong>
        <Transition name="pop">
          <span v-if="lastPoints !== null" class="points-popup" :style="{ color: lastMultiplier.color }">
            +{{ lastPoints }} {{ lastMultiplier.label }}
          </span>
        </Transition>
      </div>
    </div>

    <div class="current-number">
      <span v-if="currentNumber !== null">Current Number: <strong>{{ currentNumber }}</strong></span>
      <span v-else-if="!gameStarted" class="hint">Click Generate to start!</span>
      <span v-else class="hint">Place the number in a box</span>
    </div>

    <button class="btn-generate" :disabled="currentNumber !== null || gameOver || gameWon" @click="generateNumber">
      Generate
    </button>

    <div class="boxes">
      <div v-for="(val, i) in boxes" :key="i" class="box-wrapper">
        <span class="box-label">{{ i + 1 }}</span>
        <button
          class="box"
          :class="{ locked: locked[i], active: !locked[i] && currentNumber !== null }"
          :disabled="locked[i] || currentNumber === null"
          @click="placeNumber(i)"
        >
          {{ val ?? '—' }}
        </button>
      </div>
    </div>

    <!-- Info Modal -->
    <div v-if="showInfo" class="modal-overlay" @click.self="showInfo = false">
      <div class="modal">
        <h2>How to Play</h2>
        <ul class="info-list">
          <li>Click <strong>Generate</strong> to get a random number (1–1000).</li>
          <li>Place it in one of the 20 boxes based on where you think it fits in ascending order.</li>
          <li>Locked boxes cannot be changed.</li>
          <li>No number will be generated twice.</li>
          <li>If the new number has no valid box, it's <strong>Game Over</strong>.</li>
          <li>Fill all 20 boxes in order to <strong>Win</strong>!</li>
        </ul>
        <button class="btn-generate" @click="showInfo = false">Got it!</button>
      </div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameOver || gameWon" class="modal-overlay">
      <div class="modal">
        <h2>{{ gameWon ? '🎉 You Win!' : '💀 Game Over' }}</h2>
        <p v-if="gameWon">You placed all 20 numbers in order!</p>
        <p v-else>{{ gameOverText }} Better luck next time!</p>
        <div class="final-score">Final Score: <strong>{{ score }}</strong></div>
        <button class="btn-generate" @click="newGame">New Game</button>
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Poppins', sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.container {
  max-width: 1200px;
  width: 100%;
  padding: 3rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

h1 {
  font-size: 3.5rem;
  letter-spacing: 0.05em;
  color: #38bdf8;
}

.btn-info {
  background: none;
  border: 2px solid #38bdf8;
  border-radius: 50%;
  width: 2.25rem;
  height: 2.25rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-info:hover { background: #1e3a5f; }

.meta-row {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
}

.stage {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.score {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
  position: relative;
}

.score strong {
  color: #38bdf8;
}

.points-popup {
  font-size: 0.65rem;
  font-weight: 400;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.4rem;
  white-space: nowrap;
}

.final-score {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
}

.final-score strong {
  color: #38bdf8;
}

.pop-enter-active { animation: pop-in 0.2s ease; }
.pop-leave-active { animation: pop-out 0.3s ease forwards; }

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.5) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes pop-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.8) translateY(-10px); }
}

.info-list {
  text-align: left;
  padding-left: 1.25rem;
  color: #94a3b8;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-list strong { color: #f1f5f9; }

.current-number {
  font-size: 1.875rem;
  min-height: 2rem;
}

.current-number strong {
  color: #facc15;
  font-size: 2.25rem;
}

.hint { color: #94a3b8; }

.btn-generate {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 0.8rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-generate:hover:not(:disabled) { background: #7dd3fc; }
.btn-generate:disabled { opacity: 0.4; cursor: not-allowed; }

.boxes {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.box-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.box-label {
  font-size: 0.875rem;
  color: #64748b;
}

.box {
  width: 100%;
  aspect-ratio: 1;
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.box.active {
  border-color: #38bdf8;
  cursor: pointer;
}

.box.active:hover {
  background: #1e3a5f;
}

.box.locked {
  border-color: #475569;
  color: #facc15;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: #1e293b;
  border: 2px solid #38bdf8;
  border-radius: 12px;
  padding: 2.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 280px;
  width: 90%;
  max-width: 400px;
}

@media (max-width: 480px) {
  h1 { font-size: 1.75rem; }

  .current-number { font-size: 1.125rem; }
  .current-number strong { font-size: 1.375rem; }

  .container { padding: 2rem 1rem; gap: 1.25rem; }

  .boxes { grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }

  .box { font-size: 1rem; }

  .btn-generate { padding: 0.65rem 1.75rem; font-size: 1rem; }
}

.modal h2 { font-size: 2rem; }
.modal p { color: #94a3b8; font-size: 1.125rem; }
</style>
