<script setup>
const TOTAL_BOXES = 20

const { version } = useAppConfig()
const { showUpdateToast } = useVersionCheck()

let toastTimer = null
watch(showUpdateToast, (val) => {
  if (val) {
    toastTimer = setTimeout(() => { showUpdateToast.value = false }, 5000)
  }
})

const { playerName, deviceId } = usePlayerName()
const { submitScore, getTopScores } = useLeaderboard()

const showNamePrompt = ref(!playerName.value)
const nameInput = ref('')
const showLeaderboard = ref(false)
const leaderboardData = ref([])
const leaderboardLoading = ref(false)

function saveName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) return
  playerName.value = trimmed
  nameInput.value = ''
  showNamePrompt.value = false
}

async function openLeaderboard() {
  showLeaderboard.value = true
  leaderboardLoading.value = true
  leaderboardData.value = await getTopScores(10)
  leaderboardLoading.value = false
}

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
const conflictBoxes = ref(new Set())
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

watch([showInfo, gameOver, gameWon, showNamePrompt, showLeaderboard], ([info, over, won, name, lb]) => {
  document.body.style.overflow = (info || over || won || name || lb) ? 'hidden' : ''
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
    const num = currentNumber.value
    const lockedVals = boxes.value.map((v, i) => locked.value[i] ? { v, i } : null).filter(Boolean)
    const leftBlock = lockedVals.filter(x => x.v > num && x.i < index).sort((a, b) => b.i - a.i)[0]
    const rightBlock = lockedVals.filter(x => x.v < num && x.i > index).sort((a, b) => a.i - b.i)[0]
    const tight = new Set()
    if (leftBlock) tight.add(leftBlock.i)
    if (rightBlock) tight.add(rightBlock.i)
    tight.add(index)
    conflictBoxes.value = tight
    setTimeout(() => {
      conflictBoxes.value = new Set()
      gameOver.value = true
      submitScore(playerName.value, deviceId.value, score.value, filledCount.value)
    }, 820)
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
    submitScore(playerName.value, deviceId.value, score.value, filledCount.value)
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

    // Find the locked boxes blocking this number
    const conflicts = new Set()
    boxes.value.forEach((v, i) => {
      if (!locked.value[i]) return
      if (v > num) {
        // This locked box is too small an index for a larger value — find the rightmost locked box with v > num that has no valid unlocked slot to its left
        conflicts.add(i)
      } else if (v < num) {
        conflicts.add(i)
      }
    })
    // Narrow down: only the tightest pair — largest locked value < num and smallest locked value > num
    const lockedVals = boxes.value.map((v, i) => locked.value[i] ? { v, i } : null).filter(Boolean)
    const leftBlock = lockedVals.filter(x => x.v < num).sort((a, b) => b.v - a.v)[0]
    const rightBlock = lockedVals.filter(x => x.v > num).sort((a, b) => a.v - b.v)[0]
    const tight = new Set()
    if (leftBlock) tight.add(leftBlock.i)
    if (rightBlock) tight.add(rightBlock.i)
    conflictBoxes.value = tight

    setTimeout(() => {
      conflictBoxes.value = new Set()
      gameOver.value = true
      submitScore(playerName.value, deviceId.value, score.value, filledCount.value)
    }, 820)
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
  conflictBoxes.value = new Set()
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Number Challenge</h1>
      <button class="btn-icon" @click="openLeaderboard" title="Leaderboard">🏆</button>
      <button class="btn-icon" @click="showInfo = true" title="How to Play">ℹ️</button>
    </div>

    <div class="player-row">
      <span class="player-name" @click="showNamePrompt = true" title="Change name">👤 {{ playerName }}</span>
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
          :class="{ locked: locked[i], active: !locked[i] && currentNumber !== null, conflict: conflictBoxes.has(i) }"
          :disabled="locked[i] || currentNumber === null"
          @click="placeNumber(i)"
        >
          {{ val ?? '—' }}
        </button>
      </div>
    </div>

    <!-- Name Prompt Modal -->
    <div v-if="showNamePrompt" class="modal-overlay">
      <div class="modal">
        <h2>👤 Your Name</h2>
        <p>Enter a name to track your score on the leaderboard.</p>
        <input
          v-model="nameInput"
          class="name-input"
          placeholder="Your name"
          maxlength="20"
          @keyup.enter="saveName"
        />
        <button class="btn-generate" :disabled="!nameInput.trim()" @click="saveName">Let's Go!</button>
      </div>
    </div>

    <!-- Leaderboard Modal -->
    <div v-if="showLeaderboard" class="modal-overlay" @click.self="showLeaderboard = false">
      <div class="modal modal--wide">
        <h2>🏆 Leaderboard</h2>
        <div v-if="leaderboardLoading" class="lb-loading">Loading...</div>
        <ol v-else class="lb-list">
          <li v-for="(entry, i) in leaderboardData" :key="i" class="lb-item">
            <span class="lb-rank">#{{ i + 1 }}</span>
            <span class="lb-player">{{ entry.playerName }}</span>
            <span class="lb-score">{{ entry.score }}</span>
            <span class="lb-stage">{{ entry.stage }}/{{ TOTAL_BOXES }}</span>
          </li>
          <li v-if="!leaderboardData.length" class="lb-empty">No scores yet. Be the first!</li>
        </ol>
        <button class="btn-generate" @click="showLeaderboard = false">Close</button>
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
        <button class="btn-close" @click="gameOver = false; gameWon = false">✕</button>
        <h2>{{ gameWon ? '🎉 You Win!' : '💀 Game Over' }}</h2>
        <p v-if="gameWon">You placed all 20 numbers in order!</p>
        <p v-else>{{ gameOverText }} Better luck next time!</p>
        <div class="final-score">Final Score: <strong>{{ score }}</strong></div>
        <button class="btn-generate" @click="newGame">New Game</button>
      </div>
    </div>

    <footer class="footer">v{{ version }}</footer>

    <!-- Update Toast -->
    <Transition name="toast">
      <div v-if="showUpdateToast" class="toast" @click="showUpdateToast = false">
        <span>🚀</span>
        <div>
          <strong>App updated to v{{ version }}</strong>
          <p>We’re making improvements to enhance your experience.</p>
        </div>
        <button class="toast-close" @click.stop="showUpdateToast = false">✕</button>
      </div>
    </Transition>
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

.btn-icon {
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

.btn-icon:hover { background: #1e3a5f; }

.player-row {
  display: flex;
  justify-content: center;
}

.player-name {
  font-size: 0.875rem;
  color: #94a3b8;
  cursor: pointer;
  border-bottom: 1px dashed #475569;
  padding-bottom: 1px;
  transition: color 0.2s;
}

.player-name:hover { color: #f1f5f9; }

.name-input {
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 8px;
  color: #f1f5f9;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  padding: 0.6rem 1rem;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}

.name-input:focus { border-color: #38bdf8; }

.modal--wide { max-width: 520px; }

.lb-loading { color: #94a3b8; }

.lb-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
}

.lb-item {
  display: grid;
  grid-template-columns: 2rem 1fr auto auto;
  gap: 0.5rem;
  align-items: center;
  background: #0f172a;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
}

.lb-rank { color: #64748b; font-weight: 600; }
.lb-player { color: #f1f5f9; text-align: left; }
.lb-score { color: #38bdf8; font-weight: 700; }
.lb-stage { color: #64748b; font-size: 0.75rem; }
.lb-empty { color: #64748b; text-align: center; padding: 1rem 0; }

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
  font-size: 1rem;
  min-height: 2rem;
}

.current-number strong {
  color: #facc15;
  font-size: 2.25rem;
}

.hint { color: #94a3b8; font-size: 1rem; }

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
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
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

.box.conflict {
  border-color: #ef4444;
  color: #ef4444;
  animation: shake 0.6s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-6px); }
  30%       { transform: translateX(6px); }
  45%       { transform: translateX(-5px); }
  60%       { transform: translateX(5px); }
  75%       { transform: translateX(-3px); }
  90%       { transform: translateX(3px); }
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
  position: relative;
}

@media (max-width: 480px) {
  h1 { font-size: 1.75rem; }

  .current-number { font-size: 0.875rem; }
  .current-number strong { font-size: 1.375rem; }

  .container { padding: 2rem 1rem; gap: 1.25rem; }

  .boxes { grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }

  .box { font-size: 0.8rem; }

  .btn-generate { padding: 0.65rem 1.75rem; font-size: 1rem; }
}

.modal h2 { font-size: 2rem; }
.modal p { color: #94a3b8; font-size: 1.125rem; }

.footer {
  font-size: 0.75rem;
  color: #334155;
  margin-top: auto;
  padding-top: 1rem;
}

.toast {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  border: 1px solid #38bdf8;
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 280px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  cursor: pointer;
  z-index: 999;
}

.toast span { font-size: 1.5rem; flex-shrink: 0; }

.toast div { flex: 1; text-align: left; }

.toast strong { font-size: 0.875rem; color: #f1f5f9; display: block; }

.toast p { font-size: 0.75rem; color: #94a3b8; margin-top: 0.15rem; }

.toast-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s;
}

.toast-close:hover { color: #f1f5f9; }

.toast-enter-active { animation: slide-up 0.3s ease; }
.toast-leave-active { animation: slide-up 0.3s ease reverse; }

@keyframes slide-up {
  from { opacity: 0; transform: translateX(-50%) translateY(-1rem); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.btn-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover { color: #f1f5f9; }
</style>
