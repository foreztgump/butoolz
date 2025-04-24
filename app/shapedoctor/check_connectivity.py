import json

# Adjacency list based on app/shapedoctor/shapedoctor.config.ts
# Note: This is 1-indexed for tile IDs (index 0 is unused)
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
    [43, 37, 36, 42, 44, 0], [0, 41, 40, 44, 0, 0], [44, 40, 39, 0, 0, 0],
    [0, 43, 42, 0, 0, 0], [0, 43, 42, 0, 0, 0]
]

# Predefined shapes from app/shapedoctor/shapedoctor.config.ts
PREDEFINED_SHAPES = [
    '11101000000000000000000000000000000000000000', # 0
    '11010010000000000000000000000000000000000000', # 1
    '11010001000000000000000000000000000000000000', # 2
    '11010000001000000000000000000000000000000000', # 3
    '11001001000000000000000000000000000000000000', # 4
    '11001000100000000000000000000000000000000000', # 5
    '11001000000100000000000000000000000000000000', # 6
    '11000001001000000000000000000000000000000000', # 7
    '11000001000100000000000000000000000000000000', # 8
    '11000001000000100000000000000000000000000000', # 9 (User's example - connected)
    '10101001000000000000000000000000000000000000', # 10
    '10101000100000000000000000000000000000000000', # 11
    '10101000000100000000000000000000000000000000', # 12
    '10100100100000000000000000000000000000000000', # 13
    '10100100010000000000000000000000000000000000', # 14
    '10100100000010000000000000000000000000000000', # 15
    '10100000100100000000000000000000000000000000', # 16
    '10100000100010000000000000000000000000000000', # 17
    '10100000100000010000000000000000000000000000', # 18
    '10011001000000000000000000000000000000000000', # 19
    '10001100100000000000000000000000000000000000', # 20
    '10001001001000000000000000000000000000000000', # 21
    '10001001000100000000000000000000000000000000', # 22
    '10001001000000100000000000000000000000000000', # 23
    '10001000100100000000000000000000000000000000', # 24
    '10001000100010000000000000000000000000000000', # 25
    '10001000100000010000000000000000000000000000', # 26
    '10001000000100100000000000000000000000000000', # 27
    '10001000000100010000000000000000000000000000', # 28
    '10001000000100000010000000000000000000000000', # 29
    '01101100000000000000000000000000000000000000', # 30
    '01101000100000000000000000000000000000000000', # 31
    '01010011000000000000000000000000000000000000', # 32
    '01001100100000000000000000000000000000000000', # 33
    '00111001000000000000000000000000000000000000', # 34
    '00000011001001000000000000000000000000000000', # 35
]

def check_connectivity(shape_string, adj_list):
    """Checks if the tiles marked '1' in a shape string form a single connected component."""
    tile_indices = [i for i, char in enumerate(shape_string) if char == '1']
    tile_ids = [i + 1 for i in tile_indices] # Convert 0-based index to 1-based ID

    if not tile_ids:
        return False # No tiles = not a valid shape
    
    target_count = len(tile_ids)
    # Expecting 4 tiles for valid shapes in this context
    if target_count != 4: 
        print(f"Warning: Shape '{shape_string}' has {target_count} tiles, expected 4.")
        # Even if count is wrong, check connectivity of the tiles it *does* have.
        # It's still invalid for the puzzle if not 4, but might not be "disconnected" per se.

    if target_count == 1:
         return True # Single tile is always connected

    visited = set()
    queue = [tile_ids[0]] # Start BFS from the first tile ID
    visited.add(tile_ids[0])
    tile_id_set = set(tile_ids) # Use a set for quick checking if a neighbor is part of the shape

    while queue:
        current_tile = queue.pop(0)
        
        # Check neighbors based on 1-based indexing of adj_list
        if 0 < current_tile < len(adj_list): # Ensure current_tile is a valid index
             neighbors = adj_list[current_tile]
             for neighbor in neighbors:
                # Check if neighbor is valid, part of the shape, and not visited yet
                if neighbor != 0 and neighbor in tile_id_set and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        else:
             # This case should ideally not happen if tile IDs are derived correctly
             print(f"Warning: Tile ID {current_tile} is out of bounds for adjacency list (size {len(adj_list)}).")

    # The shape is connected if the number of visited tiles equals the total number of tiles in the shape
    return len(visited) == target_count

# Check all predefined shapes
disconnected_shapes = []
for index, shape in enumerate(PREDEFINED_SHAPES):
    is_connected = check_connectivity(shape, ADJACENT_LIST)
    if not is_connected:
        disconnected_shapes.append({"index": index, "shape": shape})

# Output the results
print(json.dumps(disconnected_shapes))