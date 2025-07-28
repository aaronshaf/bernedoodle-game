
# Technical Plan: Bernedoodle Game

## 1. Overview

This document outlines the technical plan for creating a 2D, top-down, two-player game with a Super Nintendo-inspired aesthetic. Players control Bernedoodle dogs using gamepads to collect treats and find rare cats for points in a neighborhood setting.

## 2. Core Technologies

*   **Runtime/Bundler:** [Bun](https.bun.sh/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Rendering:** HTML5 Canvas API (No external game engine to keep it lightweight)
*   **Deployment:** GitHub Actions to GitHub Pages

## 3. Project Setup & Structure

### 3.1. Initial Setup

1.  Initialize the project with Bun:
    ```bash
    bun init -y
    ```
2.  Create the necessary directories:
    ```bash
    mkdir -p src assets .github/workflows
    ```
3.  Create the main HTML file:
    ```bash
    touch index.html
    ```
4.  Create the main TypeScript file:
    ```bash
    touch src/main.ts
    ```

### 3.2. Proposed File Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .husky/
│   └── pre-commit
├── assets/
│   ├── bernedoodle_1.png
│   ├── bernedoodle_2.png
│   ├── cat.png
│   ├── treat.png
│   └── tileset.png
├── src/
│   ├── constants.ts
│   ├── game.ts
│   ├── input.ts
│   ├── player.ts
│   ├── collectibles.ts
│   └── utils.ts
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

### 3.3. TypeScript Configuration

Create a `tsconfig.json` file with the following configuration:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"]
}
```

## 4. Game Implementation Details

### 4.1. `index.html`

This will be the entry point of the game. It should contain a `<canvas>` element and a script tag to load the bundled JavaScript.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bernedoodle Game</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #2d2d2d; }
        canvas { display: block; margin: 0 auto; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script type="module" src="src/main.ts"></script>
</body>
</html>
```

### 4.2. Game Loop (`src/game.ts`)

*   Create a `Game` class to manage the canvas, game state, and rendering.
*   The main game loop will be driven by `requestAnimationFrame`.
*   The loop will:
    1.  Clear the canvas.
    2.  Update player positions based on input.
    3.  Check for collisions between players and collectibles.
    4.  Render the map, players, collectibles, and UI.

### 4.3. Input Handling (`src/input.ts`)

*   Use the `navigator.getGamepads()` method to detect and manage connected controllers.
*   Create an `InputManager` class to handle gamepad state for two players.
*   Listen for the `gamepadconnected` and `gamepaddisconnected` events.
*   In the game loop, poll the state of the axes (for movement) and buttons (if any actions are added later) for each active gamepad.

### 4.4. Player (`src/player.ts`)

*   Create a `Player` class to manage the state of each Bernedoodle.
*   Properties should include `x`, `y`, `speed`, `score`, and a reference to their sprite.
*   Include an `update()` method to change the player's position based on gamepad input.
*   Include a `draw()` method to render the player on the canvas.

### 4.5. Collectibles (`src/collectibles.ts`)

*   Create a base `Collectible` class with `x`, `y`, `points`, and a sprite.
*   Create `Treat` and `Cat` classes that extend `Collectible`.
*   Manage an array of active collectibles on the map. When collected, they should be removed and respawned at a new random location.

### 4.6. UI/HUD

*   Render scores directly onto the canvas using `ctx.fillText()`.
*   Player 1's score will be in the top-left corner.
*   Player 2's score will be in the top-right corner.
*   Use a pixel-art font for the SNES aesthetic.

## 5. Development Workflow

### 5.1. `package.json` Scripts

Add the following scripts to `package.json`:

```json
"scripts": {
  "dev": "bun run index.html",
  "build": "bun build ./src/main.ts --outdir ./dist",
  "prepare": "husky install"
}
```

### 5.2. Pre-commit Hook for File Length

1.  Install `husky`:
    ```bash
    bun add -d husky
    ```
2.  Initialize `husky`:
    ```bash
    npx husky install
    ```
3.  Create the pre-commit hook:
    ```bash
    npx husky add .husky/pre-commit "npx --no-install line-count-pre-commit -l 600"
    ```
4.  Install the line-count dependency:
    ```bash
    bun add -d line-count-pre-commit
    ```

### 5.3. GitHub Actions for Deployment

Create the `.github/workflows/deploy.yml` file with the following content. This workflow will build the project and deploy the `dist` folder to the `gh-pages` branch.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 
        uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Dependencies
        run: bun install

      - name: Build Project
        run: bun run build

      - name: Deploy 
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: dist
```

## 6. Art Assets

*   **Style:** Pixel art to match the SNES vibe.
*   **Player Sprites:** Top-down view of a Bernedoodle. At least a simple idle animation (e.g., 2 frames) would be ideal.
*   **Collectible Sprites:** A dog treat and a cat.
*   **Map:** A tileset for creating the neighborhood map (e.g., grass, pavement, houses).
*   **Format:** PNG with transparent backgrounds.
