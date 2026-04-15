# Number Challenge

Too relaxed? This game will fix that. A strategic number placement game. Generate random numbers and place them in the correct order across 20 boxes before it's too late.

## How to Play

1. Click the **Generate** button to produce a random number between 1 and 1000.
2. Decide which of the 20 boxes best fits that number based on its value relative to others.
3. Click your chosen box to place the number — it locks immediately.
4. Previously filled boxes are locked and cannot be changed.
5. Each generated number is unique — no number will appear twice in the same game.
6. A stage counter (e.g. **Stage 3/20**) tracks your progress.
7. Continue until all 20 boxes are filled to win.

## Game Over

A game over occurs when a newly generated number cannot logically fit into any remaining box without violating the ascending order sequence.

**Example:**
- You place **34** in box 1.
- Later, the game generates **7**.
- Since box 1 is already taken and no lower box is available for **7**, a **Game Over** screen appears with a random message.
- From the modal, you can start a new game.

## Objective

Successfully place all 20 generated numbers in ascending order across the 20 boxes without running into a conflict.

## Features

- 20 placement boxes in a responsive grid
- Stage counter (e.g. Stage 1/20)
- Speed-based scoring with multiplier feedback
- Unique number generation — no duplicates
- Placement validation — invalid placements trigger game over immediately
- Randomized game over messages
- ℹ️ How to Play modal
- Background scroll locked when any modal is open
- Mobile responsive layout
- Custom 4xx and 5xx error pages
- SEO and social sharing meta tags (Open Graph + Twitter Card)

## Tech Stack

- Nuxt 4
- Vue 3 Composition API
- Poppins font (Google Fonts)
