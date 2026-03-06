import collections

# --- Constants based on your provided code ---
TOTAL_TILES = 44

# Adjacency list (1-based index matching your code)
# Index 0 is unused padding
# Corrected for 44 tiles based on geometry
ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0],    # 0 (padding)
    [2, 3, 5, 0, 0, 0],    # 1
    [1, 4, 5, 8, 0, 0],    # 2
    [1, 5, 6, 9, 0, 0],    # 3
    [2, 7, 8, 11, 0, 0],   # 4
    [1, 2, 3, 8, 9, 12],   # 5
    [3, 9, 10, 13, 0, 0],  # 6
    [4, 11, 14, 0, 0, 0],  # 7
    [2, 4, 5, 11, 12, 15], # 8
    [3, 5, 6, 12, 13, 16], # 9
    [6, 13, 17, 0, 0, 0],  # 10
    [4, 7, 8, 14, 15, 18], # 11
    [5, 8, 9, 15, 16, 19], # 12
    [6, 9, 10, 16, 17, 20],# 13
    [7, 11, 18, 21, 0, 0], # 14
    [8, 11, 12, 18, 19, 22],# 15
    [9, 12, 13, 19, 20, 23],# 16
    [10, 13, 20, 24, 0, 0], # 17
    [11, 14, 15, 21, 22, 25],# 18
    [12, 15, 16, 22, 23, 26],# 19
    [13, 16, 17, 23, 24, 27],# 20
    [14, 18, 25, 28, 0, 0], # 21
    [15, 18, 19, 25, 26, 29],# 22
    [16, 19, 20, 26, 27, 30],# 23
    [17, 20, 27, 31, 0, 0], # 24
    [18, 21, 22, 28, 29, 32],# 25
    [19, 22, 23, 29, 30, 33],# 26
    [20, 23, 24, 30, 31, 34],# 27
    [21, 25, 32, 35, 0, 0], # 28
    [22, 25, 26, 32, 33, 36],# 29
    [23, 26, 27, 33, 34, 37],# 30
    [24, 27, 34, 38, 0, 0], # 31
    [25, 28, 29, 35, 36, 39],# 32
    [26, 29, 30, 36, 37, 40],# 33
    [27, 30, 31, 37, 38, 41],# 34
    [28, 32, 39, 0, 0, 0],  # 35
    [29, 32, 33, 39, 40, 42],# 36
    [30, 33, 34, 40, 41, 43],# 37
    [31, 34, 41, 0, 0, 0],  # 38
    [32, 35, 36, 42, 0, 0], # 39
    [33, 36, 37, 42, 43, 44],# 40
    [34, 37, 38, 43, 0, 0], # 41
    [36, 39, 40, 44, 0, 0], # 42
    [37, 40, 41, 44, 0, 0], # 43
    [40, 42, 43, 0, 0, 0]   # 44
]

# Hex grid coordinates (map ID to q, r)
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

# Create a dictionary for easy lookup: ID -> (q, r)
ID_TO_COORDS = {item["id"]: (item["q"], item["r"]) for item in HEX_GRID_COORDS_LIST}

def get_normalized_shape(tile_ids):
    """
    Calculates a canonical representation for a shape based on relative coordinates.
    Args:
        tile_ids: A set or list of 4 tile IDs forming the shape.
    Returns:
        A frozenset of 4 (q, r) tuples representing the normalized shape,
        or None if input is invalid.
    """
    if len(tile_ids) != 4:
        return None

    coords = [ID_TO_COORDS[tid] for tid in tile_ids]

    # Find the anchor tile (using the one with the minimum ID)
    min_id = min(tile_ids)
    anchor_q, anchor_r = ID_TO_COORDS[min_id]

    # Calculate relative coordinates
    relative_coords = set()
    for q, r in coords:
        relative_coords.add((q - anchor_q, r - anchor_r))

    # Return an immutable (hashable) version
    return frozenset(relative_coords)

def find_unique_shapes():
    """
    Finds all unique, connected, 4-tile shapes on the grid.
    Returns:
        A list of strings, each representing a unique shape in '0'/'1' format.
    """
    unique_normalized_shapes = set()
    corresponding_tile_id_sets = set() # Store the actual tile IDs for unique shapes

    # Use BFS to find all connected groups of 4 tiles
    queue = collections.deque()
    visited_sets = set() # Store frozensets of visited tile combinations

    # Initialize queue with paths of length 1 starting from each tile
    for start_id in range(1, TOTAL_TILES + 1):
        path = [start_id]
        path_set = frozenset(path)
        queue.append(path)
        visited_sets.add(path_set)

    while queue:
        current_path = queue.popleft()
        current_path_set = frozenset(current_path)

        if len(current_path) == 4:
            # Found a potential shape of size 4
            normalized = get_normalized_shape(current_path)
            if normalized not in unique_normalized_shapes:
                unique_normalized_shapes.add(normalized)
                corresponding_tile_id_sets.add(current_path_set)
            continue # Don't expand paths longer than 4

        # Expand from the last tile in the path
        last_tile = current_path[-1]
        neighbors = ADJACENT_LIST[last_tile]

        for neighbor in neighbors:
            # Ensure neighbor is valid and not already in the current path
            if neighbor != 0 and neighbor not in current_path_set:
                new_path = current_path + [neighbor]
                new_path_set = frozenset(new_path)

                # Only add if this specific combination of tiles hasn't been visited
                if new_path_set not in visited_sets:
                    visited_sets.add(new_path_set)
                    queue.append(new_path)

    # Convert the unique tile ID sets to the string format
    result_shapes = []
    sorted_tile_id_sets = sorted([tuple(sorted(list(s))) for s in corresponding_tile_id_sets])

    for tile_set_tuple in sorted_tile_id_sets:
        shape_str = ""
        tile_set = set(tile_set_tuple)
        for i in range(1, TOTAL_TILES + 1):
            shape_str += "1" if i in tile_set else "0"
        result_shapes.append(shape_str)

    return result_shapes

# --- Execute and Print ---
if __name__ == "__main__":
    unique_shapes_list = find_unique_shapes()

    print(f"Found {len(unique_shapes_list)} unique 4-hex connected shapes.")
    print("\nArray of shapes (Python list of strings):")
    # Print in a format easy to copy/paste as a Python list
    print("[")
    for i, shape in enumerate(unique_shapes_list):
        print(f"    '{shape}'," + (" # Shape " + str(i+1) if i < 10 else "")) # Add comments for first few
    print("]")

    # Optional: Print each shape with its tile numbers for verification
    print("\nDetails:")
    for i, shape_str in enumerate(unique_shapes_list):
        tiles = [idx + 1 for idx, char in enumerate(shape_str) if char == '1']
        print(f"Shape {i+1}: {shape_str} -> Tiles {sorted(tiles)}")