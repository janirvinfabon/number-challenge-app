# Technical Guide — Number Challenge

## Prerequisites

- [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
- Node.js v20 (via nvm)
- npm v10 or higher (comes with Node.js v20)

---

## Project Setup

### 1. Set Node.js Version

```bash
nvm use 20
```

> If Node.js v20 is not installed yet:
> ```bash
> nvm install 20
> nvm use 20
> ```

### 2. Scaffold the Nuxt 4 App

```bash
npx nuxi@latest init number-challenge-app
cd number-challenge-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. package.json

After scaffolding, your `package.json` will look like this:

```json
{
  "name": "number-challenge-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "nuxt": "^4.x.x",
    "vue": "^3.x.x",
    "vue-router": "^5.x.x"
  }
}
```

---

## Development

Start the local dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
number-challenge-app/
├── app/
│   ├── app.vue           # Main game UI and logic
│   └── error.vue         # 4xx and 5xx error pages
├── public/
│   └── game-cover.png    # Social sharing cover image
├── nuxt.config.ts        # Nuxt configuration + meta tags
├── package.json
├── README.md             # Game description
└── TECHNICAL.md          # This file
```

---

## Game Implementation

All game logic lives in `app/app.vue` using the Vue 3 Composition API (`<script setup>`).

### Key State

| Variable | Type | Description |
|---|---|---|
| `boxes` | `Array` | 20 box values |
| `locked` | `Array<boolean>` | Tracks which boxes are locked |
| `currentNumber` | `number \| null` | The currently generated number |
| `usedNumbers` | `Set<number>` | Prevents duplicate generation |
| `gameOver` | `boolean` | Controls game over modal visibility |
| `gameWon` | `boolean` | Controls win modal visibility |
| `gameStarted` | `boolean` | Tracks if the game has begun |
| `showInfo` | `boolean` | Controls How to Play modal visibility |
| `gameOverText` | `string` | Randomly selected game over message |
| `score` | `ref<number>` | Current total score |
| `lastPoints` | `ref<number\|null>` | Points earned on last placement (for popup) |
| `lastMultiplier` | `ref<object\|null>` | Multiplier label and color for popup |
| `placedAt` | `ref<number\|null>` | Timestamp when current number was generated |
| `filledCount` | `computed` | Number of locked boxes (stage counter) |

### Core Logic

#### Generate a Number
- Picks a random number between 1–1000 not in `usedNumbers`
- Adds it to `usedNumbers` and sets it as `currentNumber`

#### Place a Number
- Player clicks a box to place `currentNumber`
- Validates the placement first via `isValidPlacement` — triggers game over if invalid
- The box is locked immediately and a new number is generated
- Triggers game over check after each placement

#### Placement Validation
`isValidPlacement(index, num)` checks if placing `num` at `index` is valid:
- All locked boxes to the left have values **less than** `num`
- All locked boxes to the right have values **greater than** `num`

Used both when the player clicks a box and when checking if any valid box remains.

#### Scoring
Each placement earns points based on how fast the player places the number after it is generated:

| Time | Multiplier | Points |
|---|---|---|
| 0–1s | 3x 🔥 | 300 |
| 1–3s | 2x ⚡ | 200 |
| 3–8s | 1x | 100 |
| 8s+ | 0.5x | 50 |

Max possible score: **6,000pts** (20 × 300). A points popup animates next to the score after each placement.

#### Game Over Check
After each placement, the game checks if `currentNumber` can fit into any remaining unlocked box without violating ascending order.

A box at index `i` is valid for `currentNumber` if:
- All filled boxes to the left have values **less than** `currentNumber`
- All filled boxes to the right have values **greater than** `currentNumber`

If no valid box exists, a random message from `GAME_OVER_TEXTS` is selected and `gameOver` is set to `true`.

#### Game Over Messages
Randomly selected from:
- Only the strong endure.
- You lacked the will to continue.
- This world devours the weak.
- Too weak.
- Learn. Adapt. Return.
- This isn't the end.
- Power was not on your side.

#### New Game
Resets all state: clears boxes, locks, used numbers, and hides all modals.

#### Scroll Lock
A `watch` on `showInfo`, `gameOver`, and `gameWon` sets `document.body.style.overflow = 'hidden'` when any modal is open, and restores it when all are closed.

---

## Error Pages

Handled by `app/error.vue` — a single file that covers all error codes:

- **4xx** — "Page Not Found" with a message and Go Home button
- **5xx** — "Server Error" with a retry message and Go Home button

The Go Home button calls `clearError({ redirect: '/' })` to reset the error state.

---

## Meta Tags

Configured in `nuxt.config.ts` under `app.head`:

- Basic SEO — `title` and `description`
- Open Graph — for Facebook, LinkedIn, Discord previews
- Twitter Card — `summary_large_image` using `/game-cover.png`

> For production, update `og:image` and `twitter:image` to use the full absolute URL (e.g. `https://yourdomain.com/game-cover.png`).

---

## Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Static Generation (Optional)

```bash
npm run generate
```

Output will be in the `.output/public` directory.
