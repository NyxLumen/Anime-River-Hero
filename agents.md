# Agent Guidelines & Repository Standards — Anime River Hero

This document outlines mandatory operational guidelines, repository hygiene rules, and architectural standards for all AI agents contributing to the **Anime River Hero** project.

---

## 1. Repository Hygiene & Directory Cleanliness (STRICT RULE)

> [!IMPORTANT]
> **Zero Root Pollution Clause**
> AI agents MUST NEVER create, dump, or leave temporary files, scratch scripts, test runners, log dumps, or rendered media assets directly in the project root directory (`/`).

### Designated Directory Structure

All files created by agents must adhere to the following organization:

* **`src/`** — **Production Source Code Only**
  * `src/core/` — Core systems (Renderer, Camera, Loop, Scene).
  * `src/world/` — 3D environmental assets, materials, systems (River, Terrain, Rocks, Trees, Vegetation, Cottage, Riverbank, Lighting).
  * `src/utils/` — Math, spline, and geometry utilities.
* **`scripts/`** — **Utility, Automation & Verification Scripts**
  * All automation, verification, Puppeteer/headless capture, and helper scripts belong in `scripts/` (e.g., `scripts/capture.js`).
  * Never place `.js`, `.py`, or `.sh` test scripts in the root directory.
  * Temporary scratch or benchmark scripts must be deleted immediately after execution or placed in a dedicated temporary folder (`scripts/scratch/`).
* **`screenshots/`** — **Visual Outputs & Render Captures**
  * All screen captures, renders, visual audits, and phase milestone images must be saved into `screenshots/` (e.g., `screenshots/Phase1_Render.png`).
  * Never write `.png`, `.jpg`, `.webp`, or video files to the project root.
* **Root Directory (`/`)** — **Configuration & Core Files Only**
  * Reserved strictly for standard project infrastructure: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `Reference.png`, `.gitignore`, and `agents.md`.

---

## 2. Terrain Grounding & Placement Standard

When authoring or placing environmental assets (trees, rocks, foliage, architecture, path elements):
1. **Never hardcode arbitrary Y heights** without consulting terrain topography.
2. **Query the terrain directly** using `terrain.getHeightAt(x, z)` to retrieve the exact terrain elevation `y`, cut-bank distance, and slope characteristics.
3. Assets must embed naturally into the terrain surface to avoid floating geometry or buried structures.

---

## 3. Visual & Art Direction Principles

* **Style Goal**: High-end painterly anime landscape painting reconstructed in 3D (Studio Ghibli / Makoto Shinkai aesthetic).
* **The River is the Hero**: The diagonal flow from top-right to bottom-left must remain visually commanding and unobstructed.
* **Smooth Harmonic Geometries**: Use smooth spherical harmonic noise for weathered organic assets (rocks, foliage lobes). Never apply uncapped random vertex noise that creates pinched poles, starbursts, or faceted polygon paper-balls.
* **Layered Anime Color Gradients**: Baked vertex colors must separate warm sunlit facets, soft saturated midtones, and cool shadows. Avoid flat solid fills or hyper-realistic PBR noise.

---

## 4. Verification & Build Protocol

Before concluding any implementation phase:
1. **Compile & Typecheck**: Run `npm run build` (`tsc && vite build`). All code must pass with **zero TypeScript errors** and **zero unused parameter warnings**.
2. **Visual Verification**: Use `scripts/capture.js` to render the scene and verify the result in `screenshots/`. Inspect the output image to ensure no visual defects, clipping, or occlusions exist.
3. **Clean Up**: Verify that no temporary files or orphaned assets remain in the root directory.
