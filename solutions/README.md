# Puzzle solutions

This directory contains one paste-ready JavaScript solution for each of Space
AI's 15 levels. The files are numbered in game order. Paste the contents of a
file into the in-game editor, then install and run it.

## How these were made

The solutions were generated in August 2026 by prompting ChatGPT 5.6 Sol,
testing its attempts in a browser-faithful local harness and in the live game,
and iterating on failures.

The harder levels were not produced without assistance. A human reviewed failed
runs and suggested what the model should investigate next. Mine Field required
the most human guidance; its final controller combines a kinodynamic beam search
for the outbound route with repeated trajectory simulation for the return.

During this work the model found a worker-protocol exploit. The exploit was
fixed in commit `8084f24`, and none of these solutions relies on it. Sentries
also needed the win-condition correction in commit `9357b40`. The temporary
patch files are omitted because both fixes are already in the repository.

## Validation

All solutions use only the documented game API. The JavaScript files have been
formatted and annotated for readability without intentionally changing their
behavior.

The navigation-heavy solutions for Lure, Grab Ammo, Aggro, Formation, Mine
Field, Asteroid Field, Circular Maze, and Square Maze were confirmed on the
live page as well as in the local harness. Mine Field, Asteroid Field, and
Square Maze each won 97 of 100 regression trials; Circular Maze, Lure, Grab
Ammo, and Formation won 100 of 100. Aggro won 286 of 300 randomized trials.
