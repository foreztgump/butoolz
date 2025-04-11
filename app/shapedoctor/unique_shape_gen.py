import collections

# --- Constants based on your provided code ---
TOTAL_TILES = 24

# Adjacency list (1-based index matching your code)
# Index 0 is unused padding
ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0], [0, 0, 2, 5, 3, 0], [0, 0, 4, 7, 5, 1], [0, 1, 5, 8, 6, 0],
    [0, 0, 0, 9, 7, 2], [1, 2, 7, 10, 8, 3], [0, 3, 8, 11, 0, 0], [2, 4, 9, 12, 10, 5],
    [3, 5, 10, 13, 11, 6], [4, 0, 0, 14, 12, 7], [5, 7, 12, 15, 13, 8], [6, 8, 13, 16, 0, 0],
    [7, 9, 14, 17, 15, 10], [8, 10, 15, 18, 16, 11], [9, 0, 0, 19, 17, 12], [10, 12, 17, 20, 18, 13],
    [11, 13, 18, 21, 0, 0], [12, 14, 19, 22, 20, 15], [13, 15, 20, 23, 21, 16], [14, 0, 0, 0, 22, 17],
    [15, 17, 22, 24, 23, 18], [16, 18, 23, 0, 0, 0], [17, 19, 0, 0, 24, 20], [18, 20, 24, 0, 0, 21],
    [20, 22, 0, 0, 0, 23],
]

# Hex grid coordinates (map ID to q, r)
HEX_GRID_COORDS_LIST = [
    { "id": 1, "q": 0, "r": 0 }, { "id": 2, "q": -1, "r": 0 }, { "id": 3, "q": 1, "r": -1 },
    { "id": 4, "q": -2, "r": 0 }, { "id": 5, "q": 0, "r": -1 }, { "id": 6, "q": 2, "r": -2 },
    { "id": 7, "q": -1, "r": -1 }, { "id": 8, "q": 1, "r": -2 }, { "id": 9, "q": -2, "r": -1 },
    { "id": 10, "q": 0, "r": -2 }, { "id": 11, "q": 2, "r": -3 }, { "id": 12, "q": -1, "r": -2 },
    { "id": 13, "q": 1, "r": -3 }, { "id": 14, "q": -2, "r": -2 }, { "id": 15, "q": 0, "r": -3 },
    { "id": 16, "q": 2, "r": -4 }, { "id": 17, "q": -1, "r": -3 }, { "id": 18, "q": 1, "r": -4 },
    { "id": 19, "q": -2, "r": -3 }, { "id": 20, "q": 0, "r": -4 }, { "id": 21, "q": 2, "r": -5 },
    { "id": 22, "q": -1, "r": -4 }, { "id": 23, "q": 1, "r": -5 }, { "id": 24, "q": 0, "r": -5 },
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