// public/solver.worker.ts

// --- Constants (Copied from component) ---
const TOTAL_TILES = 24;
// 0 indicates none
// [top, topleft, bottomleft, bottom, bottomright, topright]
const ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0], [0, 0, 2, 5, 3, 0], [0, 0, 4, 7, 5, 1], [0, 1, 5, 8, 6, 0],
    [0, 0, 0, 9, 7, 2], [1, 2, 7, 10, 8, 3], [0, 3, 8, 11, 0, 0], [2, 4, 9, 12, 10, 5],
    [3, 5, 10, 13, 11, 6], [4, 0, 0, 14, 12, 7], [5, 7, 12, 15, 13, 8], [6, 8, 13, 16, 0, 0],
    [7, 9, 14, 17, 15, 10], [8, 10, 15, 18, 16, 11], [9, 0, 0, 19, 17, 12], [10, 12, 17, 20, 18, 13],
    [11, 13, 18, 21, 0, 0], [12, 14, 19, 22, 20, 15], [13, 15, 20, 23, 21, 16], [14, 0, 0, 0, 22, 17],
    [15, 17, 22, 24, 23, 18], [16, 18, 23, 0, 0, 0], [17, 19, 0, 0, 24, 20], [18, 20, 24, 0, 0, 21],
    [20, 22, 0, 0, 0, 23],
];
const PROGRESS_UPDATE_INTERVAL = 5000; // Send update every 5000 states explored
const NUM_HEX_COLORS = 12; // Match the length of HEX_COLORS in page.tsx

// --- Solver Logic (Copied and adapted) ---

// index_of_potential is the number of which potential in the list_of_potentials array that should be added
// solution is an array where each index represents either -1 for empty or the ID of which potential is placed there
// solution_offset is the tile that should be used in the solution
// potential_offset is the tile that should be used from the potential
// used is an array that indicates which tiles of the potential have already been placed in the solution
// return either true if the fit worked, false if there was an overlap or the potential was out of bounds
const fitPotential = (
    potentialsList: string[], // Pass potentials array
    potentialIndex: number,
    currentSolution: number[], // Mutable copy for recursion branch
    solutionOffset: number,
    potentialOffset: number,
    usedPotentialTiles: Set<number>
): boolean => {
    if (potentialIndex < 0 || potentialIndex >= potentialsList.length) return false; // Bounds check

    const potentialString = potentialsList[potentialIndex];
    let effectivePotentialOffset = potentialOffset;

    // Find the first '1' in the potential string if starting
    if (effectivePotentialOffset === -1) {
        effectivePotentialOffset = potentialString.indexOf('1') + 1;
        if (effectivePotentialOffset === 0) return false; // Potential has no tiles?
    }

    // Check bounds and overlap for the current tile placement
    if (solutionOffset <= 0 || solutionOffset > TOTAL_TILES || currentSolution[solutionOffset] !== -1) {
        return false; // Out of bounds or tile already occupied
    }

    // Place the tile
    currentSolution[solutionOffset] = potentialIndex;
    usedPotentialTiles.add(effectivePotentialOffset);

    // Explore neighbours
    const potentialNeighbors = ADJACENT_LIST[effectivePotentialOffset];
    const solutionNeighbors = ADJACENT_LIST[solutionOffset];
    if (!potentialNeighbors || !solutionNeighbors) return false; // Safety check

    for (let j = 0; j < 6; j++) {
        const potentialNeighborTile = potentialNeighbors[j];

        if (potentialNeighborTile !== 0 && potentialString.charAt(potentialNeighborTile - 1) === '1') {
            // If the neighbor is part of the potential shape
            if (!usedPotentialTiles.has(potentialNeighborTile)) {
                // And hasn't been placed yet in this recursive path
                const solutionNeighborTile = solutionNeighbors[j];

                if (solutionNeighborTile === 0) {
                    return false; // Can't place neighbor, leads out of bounds
                }

                // Recursively try to place the neighbour
                const result = fitPotential(
                    potentialsList, potentialIndex, currentSolution,
                    solutionNeighborTile, potentialNeighborTile, usedPotentialTiles
                );
                if (!result) {
                    return false; // If any neighbour placement fails, this path fails
                }
            }
        }
    }

    return true; // All connected tiles of the potential were placed successfully from this starting point
};


// Main recursive solving function
const solveRecursive = (
    potentialsList: string[], // Pass potentials array
    currentSolution: number[],
    potentialIdxToTry: number,
    allSolutions: number[][], // Accumulator for all found solutions
    searchedStates: Set<string> // To avoid redundant searches
): void => { // Changed return to void as boolean wasn't really used effectively
    // Optimization: Use join instead of JSON.stringify for potentially faster keys
    const stateKey = currentSolution.join(',') + '|' + potentialIdxToTry;
    if (searchedStates.has(stateKey)) {
        return; // Already explored this state
    }
    searchedStates.add(stateKey);

    // *** ADD Progress Update ***
    if (searchedStates.size % PROGRESS_UPDATE_INTERVAL === 0) {
      self.postMessage({ type: 'progress', count: searchedStates.size });
    }
    // *** END Progress Update ***


    if (potentialIdxToTry >= potentialsList.length) {
        // Base case: Tried all potentials for this branch
        allSolutions.push([...currentSolution]); // Add a copy
        return;
    }

    // Option 1: Try to place the current potential (potentialIdxToTry)
    for (let startTile = 1; startTile <= TOTAL_TILES; startTile++) {
        const tempSolution = [...currentSolution]; // Create a copy for this attempt
        const usedTiles = new Set<number>();

        // Make a separate mutable copy ONLY for fitPotential's recursion branch
        const fitAttemptSolution = [...tempSolution];

        if (fitPotential(potentialsList, potentialIdxToTry, fitAttemptSolution, startTile, -1, usedTiles)) {
             // If placement succeeded, recurse for the *next* potential using the modified grid
             // Pass the successfully modified 'fitAttemptSolution' down
            solveRecursive(potentialsList, fitAttemptSolution, potentialIdxToTry + 1, allSolutions, searchedStates);
        }
        // If fitPotential fails, we just try the next startTile with the original 'tempSolution' (which is same as currentSolution here)
    }

    // Option 2: Skip placing the current potential and move to the next one
    // This ensures we find solutions even if not all potentials can be placed
    solveRecursive(potentialsList, currentSolution, potentialIdxToTry + 1, allSolutions, searchedStates);

};

// --- Graph Coloring Helper ---
const colorSolution = (solutionGrid: number[], numColors: number): number[] => {
    const coloredGrid = Array(TOTAL_TILES + 1).fill(-1);
    const potentialAdjacency: Map<number, Set<number>> = new Map();
    const potentialIndicesPresent: Set<number> = new Set();

    // 1. Build adjacency graph
    for (let tileIdx = 1; tileIdx <= TOTAL_TILES; tileIdx++) {
        const potentialIdx1 = solutionGrid[tileIdx];
        if (potentialIdx1 === -1) continue;
        potentialIndicesPresent.add(potentialIdx1);
        if (!potentialAdjacency.has(potentialIdx1)) {
            potentialAdjacency.set(potentialIdx1, new Set());
        }
        const neighbors = ADJACENT_LIST[tileIdx];
        if (!neighbors) continue;
        for (const neighborTileIdx of neighbors) {
            if (neighborTileIdx === 0) continue;
            const potentialIdx2 = solutionGrid[neighborTileIdx];
            if (potentialIdx2 !== -1 && potentialIdx1 !== potentialIdx2) {
                if (!potentialAdjacency.has(potentialIdx2)) {
                     potentialAdjacency.set(potentialIdx2, new Set());
                }
                potentialAdjacency.get(potentialIdx1)?.add(potentialIdx2);
                potentialAdjacency.get(potentialIdx2)?.add(potentialIdx1);
            }
        }
    }

    // 2. Assign colors greedily
    const potentialColorMap: Map<number, number> = new Map();
    const sortedPotentialIndices = Array.from(potentialIndicesPresent).sort((a, b) => a - b);

    for (const potentialIdx of sortedPotentialIndices) {
        const neighborColors = new Set<number>();
        const adjacentPotentials = potentialAdjacency.get(potentialIdx) || new Set();
        for (const neighborPotentialIdx of adjacentPotentials) {
            if (potentialColorMap.has(neighborPotentialIdx)) {
                neighborColors.add(potentialColorMap.get(neighborPotentialIdx)!);
            }
        }
        let assignedColor = -1;
        for (let colorIdx = 0; colorIdx < numColors; colorIdx++) {
            if (!neighborColors.has(colorIdx)) {
                assignedColor = colorIdx;
                break;
            }
        }
        if (assignedColor === -1) {
             console.warn(`[Worker] Could not find unique color for potential ${potentialIdx}, cycling colors.`);
             assignedColor = potentialIdx % numColors;
        }
        potentialColorMap.set(potentialIdx, assignedColor);
    }

    // 3. Create final colored grid
    for (let tileIdx = 1; tileIdx <= TOTAL_TILES; tileIdx++) {
        const potentialIdx = solutionGrid[tileIdx];
        if (potentialIdx !== -1 && potentialColorMap.has(potentialIdx)) {
            coloredGrid[tileIdx] = potentialColorMap.get(potentialIdx)!;
        }
    }
    return coloredGrid;
};

// --- Web Worker Message Handling (Modified for Coloring) ---
self.onmessage = (event: MessageEvent<{ potentials: string[] }>) => {
    const { potentials: potentialsList } = event.data;
    if (!potentialsList || potentialsList.length === 0) { self.postMessage({ type: 'error', message: 'No potentials provided.' }); return; }

    const initialSolution = Array(TOTAL_TILES + 1).fill(-1);
    const allFoundSolutions: number[][] = [];
    const searchedStates = new Set<string>();

    try {
        solveRecursive(potentialsList, initialSolution, 0, allFoundSolutions, searchedStates);

        let minEmptyTiles = TOTAL_TILES + 1;
        let bestSolutionsRaw: number[][] = [];

        if (allFoundSolutions.length > 0) {
             allFoundSolutions.forEach(sol => {
                const emptyCount = sol.reduce((count, tile, index) => index === 0 ? count : (tile === -1 ? count + 1 : count), 0);
                if (emptyCount < minEmptyTiles) { minEmptyTiles = emptyCount; bestSolutionsRaw = [sol]; }
                else if (emptyCount === minEmptyTiles) { const solString = sol.join(','); if (!bestSolutionsRaw.some(existing => existing.join(',') === solString)) { bestSolutionsRaw.push(sol); } }
             });
        }

        // Color the best solutions
        const bestSolutionsColored = bestSolutionsRaw.map(rawSolution =>
            colorSolution(rawSolution, NUM_HEX_COLORS)
        );

        self.postMessage({ type: 'progress', count: searchedStates.size }); // Final progress

        // Send colored solutions
        self.postMessage({
            type: 'result',
            bestSolutions: bestSolutionsColored,
            searchedCount: searchedStates.size
        });

    } catch (error) {
        console.error('[Worker] Error during solving:', error);
        self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Unknown worker error' });
    }
};

// Indicate worker is ready (optional)
// self.postMessage({ type: 'ready' });