import json

# --- Data from app/shapedoctor/shapedoctor.config.ts ---
TOTAL_TILES = 44

HEX_GRID_COORDS_LIST = [
    { "id": 1, "q": 0, "r": -3 },
    { "id": 2, "q": -1, "r": -2 }, { "id": 3, "q": 1, "r": -3 },
    { "id": 4, "q": -2, "r": -1 }, { "id": 5, "q": 0, "r": -2 }, { "id": 6, "q": 2, "r": -3 },
    { "id": 7, "q": -3, "r": 0 },  { "id": 8, "q": -1, "r": -1 }, { "id": 9, "q": 1, "r": -2 }, { "id": 10, "q": 3, "r": -3 },
    { "id": 11, "q": -2, "r": 0 }, { "id": 12, "q": 0, "r": -1 }, { "id": 13, "q": 2, "r": -2 }, { "id": 17, "q": 3, "r": -2 },
    { "id": 14, "q": -3, "r": 1 }, { "id": 15, "q": -1, "r": 0 }, { "id": 16, "q": 1, "r": -1 }, { "id": 20, "q": 2, "r": -1 }, { "id": 24, "q": 3, "r": -1 },
    { "id": 18, "q": -2, "r": 1 }, { "id": 19, "q": 0, "r": 0 }, { "id": 22, "q": -1, "r": 1 }, { "id": 23, "q": 1, "r": 0 }, { "id": 27, "q": 2, "r": 0 }, { "id": 31, "q": 3, "r": 0 },
    { "id": 21, "q": -3, "r": 2 }, { "id": 25, "q": -2, "r": 2 }, { "id": 26, "q": 0, "r": 1 }, { "id": 29, "q": -1, "r": 2 }, { "id": 30, "q": 1, "r": 1 }, { "id": 34, "q": 2, "r": 1 }, { "id": 38, "q": 3, "r": 1 },
    { "id": 28, "q": -3, "r": 3 }, { "id": 32, "q": -2, "r": 3 }, { "id": 33, "q": 0, "r": 2 }, { "id": 36, "q": -1, "r": 3 }, { "id": 37, "q": 1, "r": 2 }, { "id": 41, "q": 2, "r": 2 },
    { "id": 35, "q": -3, "r": 4 }, { "id": 39, "q": -2, "r": 4 }, { "id": 40, "q": 0, "r": 3 }, { "id": 42, "q": -1, "r": 4 }, { "id": 43, "q": 1, "r": 3 }, { "id": 44, "q": 0, "r": 4 }
]

ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0],
    [3, 0, 0, 2, 5, 0], [5, 1, 0, 0, 8, 4], [6, 0, 1, 5, 9, 0],
    [8, 2, 0, 0, 11, 7], [9, 3, 2, 8, 12, 0], [10, 0, 3, 9, 13, 0],
    [11, 4, 0, 0, 14, 0], [12, 5, 4, 11, 15, 0], [13, 6, 5, 12, 16, 0],
    [17, 0, 6, 13, 0, 0], [15, 8, 7, 0, 18, 14], [16, 9, 8, 15, 19, 0],
    [17, 10, 9, 16, 20, 0], [18, 11, 0, 0, 21, 7], [19, 12, 11, 18, 22, 0],
    [20, 13, 12, 19, 23, 0], [24, 0, 13, 20, 0, 10], [22, 15, 14, 21, 25, 0],
    [23, 16, 15, 22, 26, 0], [27, 17, 16, 23, 24, 0], [25, 18, 0, 0, 28, 14],
    [26, 19, 18, 25, 29, 0], [27, 20, 19, 26, 30, 0], [31, 0, 20, 27, 0, 17],
    [29, 22, 21, 28, 32, 0], [30, 23, 22, 29, 33, 0], [34, 24, 23, 30, 31, 0],
    [32, 25, 0, 0, 35, 21], [33, 26, 25, 32, 36, 0], [34, 27, 26, 33, 37, 0],
    [38, 0, 27, 34, 0, 24], [36, 29, 28, 35, 39, 0], [37, 30, 29, 36, 40, 0],
    [41, 31, 30, 37, 38, 0], [39, 32, 0, 0, 0, 28], [40, 33, 32, 39, 42, 0],
    [41, 34, 33, 40, 43, 0], [0, 0, 34, 41, 0, 31], [42, 36, 35, 0, 0, 0],
    [43, 37, 36, 42, 44, 0], [0, 38, 37, 43, 0, 0], #[41] error here: 38, 37, 43 should be neighbors. 0,0,0?
    [44, 40, 39, 0, 0, 0], #42
    [0, 41, 40, 44, 0, 0], #43
    [0, 43, 42, 0, 0, 0] #44 error here? 41, 43, 42 should be neighbors based on coords
]
# --- End Data ---

# Create mappings
ID_TO_COORDS = {item["id"]: (item["q"], item["r"]) for item in HEX_GRID_COORDS_LIST}
COORDS_TO_ID = {(item["q"], item["r"]): item["id"] for item in HEX_GRID_COORDS_LIST}

# Axial direction vectors
DIRECTIONS = [
    (1, 0), (1, -1), (0, -1),
    (-1, 0), (-1, 1), (0, 1)
]

discrepancies = []

# Validate adjacency list
for tile_id in range(1, TOTAL_TILES + 1):
    if tile_id not in ID_TO_COORDS:
        print(f"Warning: Tile ID {tile_id} not found in HEX_GRID_COORDS_LIST.")
        continue
        
    if tile_id >= len(ADJACENT_LIST):
         print(f"Error: Tile ID {tile_id} is out of bounds for ADJACENT_LIST (size {len(ADJACENT_LIST)}).")
         continue

    current_q, current_r = ID_TO_COORDS[tile_id]
    listed_neighbors = set(filter(lambda x: x != 0, ADJACENT_LIST[tile_id]))

    calculated_neighbors = set()
    for dq, dr in DIRECTIONS:
        neighbor_q, neighbor_r = current_q + dq, current_r + dr
        neighbor_coord = (neighbor_q, neighbor_r)
        if neighbor_coord in COORDS_TO_ID:
            calculated_neighbors.add(COORDS_TO_ID[neighbor_coord])

    if listed_neighbors != calculated_neighbors:
        missing_neighbors = calculated_neighbors - listed_neighbors
        extra_neighbors = listed_neighbors - calculated_neighbors
        discrepancies.append({
            "tile_id": tile_id,
            "listed": sorted(list(listed_neighbors)),
            "calculated": sorted(list(calculated_neighbors)),
            "missing_in_list": sorted(list(missing_neighbors)),
            "extra_in_list": sorted(list(extra_neighbors))
        })

# Report results
if not discrepancies:
    print("Validation PASSED: ADJACENT_LIST is consistent with HEX_GRID_COORDS.")
else:
    print("Validation FAILED: Discrepancies found between ADJACENT_LIST and calculated neighbors based on coordinates:")
    print(json.dumps(discrepancies, indent=2))
