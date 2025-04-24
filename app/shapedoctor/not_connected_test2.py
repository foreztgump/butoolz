import collections
import re
from typing import List, Tuple, Set, FrozenSet

# --- 44-TILE ADJACENT_LIST (Verified Rotation-Based Version) ---
ADJACENT_LIST = [
    [0, 0, 0, 0, 0, 0], [3, 0, 0, 0, 2, 5], [5, 0, 0, 4, 8, 0], [6, 0, 1, 5, 9, 0],
    [8, 2, 0, 7, 11, 0], [9, 3, 2, 8, 12, 1], [10, 0, 3, 9, 13, 0], [11, 4, 0, 0, 14, 0],
    [12, 5, 4, 11, 15, 2], [13, 6, 5, 12, 16, 3], [17, 0, 6, 13, 0, 0], [15, 8, 7, 0, 18, 14],
    [16, 9, 8, 15, 19, 5], [20, 10, 9, 16, 0, 6], [18, 11, 0, 0, 21, 7], [19, 12, 11, 0, 22, 8],
    [23, 13, 12, 19, 0, 9], [24, 0, 10, 20, 0, 0], [22, 15, 14, 0, 25, 21], [23, 16, 12, 15, 22, 26],
    [27, 17, 13, 23, 0, 0], [25, 18, 0, 0, 28, 14], [26, 19, 18, 0, 29, 15], [27, 20, 16, 19, 26, 30],
    [31, 0, 17, 27, 0, 0], [29, 22, 21, 0, 32, 28], [30, 23, 19, 22, 29, 33], [34, 24, 20, 23, 30, 31],
    [32, 25, 0, 0, 35, 21], [33, 26, 25, 0, 36, 22], [37, 27, 23, 26, 33, 34], [38, 0, 24, 27, 34, 0],
    [36, 29, 28, 0, 39, 35], [40, 30, 26, 29, 36, 37], [41, 31, 27, 30, 37, 38], [39, 32, 0, 0, 0, 28],
    [40, 33, 32, 0, 42, 29], [43, 34, 30, 33, 40, 41], [0, 0, 31, 34, 41, 0], [42, 36, 35, 0, 0, 0],
    [43, 37, 33, 36, 42, 44], [0, 38, 34, 37, 43, 0], [44, 40, 39, 0, 0, 36], [0, 41, 37, 40, 44, 0],
    [0, 43, 40, 42, 0, 0]
]

# --- Connectivity Check Function ---
def is_connected(tile_ids: List[int], adj_list: List[List[int]]) -> bool:
    """Checks if a group of tile IDs forms a single connected component."""
    if not tile_ids:
        return True # Empty set is arguably connected
    if len(tile_ids) == 1:
        return True # Single tile is connected

    group_set = set(tile_ids)
    start_node = tile_ids[0]

    # Check if start_node is valid
    if not (0 < start_node < len(adj_list)):
        print(f"Warning: Start node {start_node} invalid for adjacency list.")
        return False # Cannot start BFS

    reachable: Set[int] = {start_node}
    queue: collections.deque[int] = collections.deque([start_node])

    while queue:
        current_node = queue.popleft()

        # Check if current_node index is valid before accessing neighbors
        if not (0 < current_node < len(adj_list)):
             # print(f"Warning: Invalid node {current_node} encountered during BFS.")
             continue # Skip processing this invalid node

        neighbors = adj_list[current_node]
        for neighbor in neighbors:
            # Check only neighbors that are part of the target group
            if neighbor in group_set and neighbor not in reachable:
                reachable.add(neighbor)
                queue.append(neighbor)

    # The group is connected if the number of reachable nodes equals the group size
    return len(reachable) == len(group_set)

# --- Log Data ---
log_data = """
[drawPreviewGrid] Index: 0, Shape: 11101000000000000000000000000000000000000000, Tiles: [1,2,3,5] hexUtils.ts:207:13
[drawPreviewGrid] Index: 1, Shape: 11010010000000000000000000000000000000000000, Tiles: [1,2,4,7] hexUtils.ts:207:13
[drawPreviewGrid] Index: 2, Shape: 11010001000000000000000000000000000000000000, Tiles: [1,2,4,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 3, Shape: 11010000001000000000000000000000000000000000, Tiles: [1,2,4,11] hexUtils.ts:207:13
[drawPreviewGrid] Index: 4, Shape: 11001001000000000000000000000000000000000000, Tiles: [1,2,5,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 5, Shape: 11001000100000000000000000000000000000000000, Tiles: [1,2,5,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 6, Shape: 11001000000100000000000000000000000000000000, Tiles: [1,2,5,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 7, Shape: 11000001001000000000000000000000000000000000, Tiles: [1,2,8,11] hexUtils.ts:207:13
[drawPreviewGrid] Index: 8, Shape: 11000001000100000000000000000000000000000000, Tiles: [1,2,8,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 9, Shape: 10101001000000000000000000000000000000000000, Tiles: [1,3,5,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 10, Shape: 10101000100000000000000000000000000000000000, Tiles: [1,3,5,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 11, Shape: 10101000000100000000000000000000000000000000, Tiles: [1,3,5,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 12, Shape: 10100100100000000000000000000000000000000000, Tiles: [1,3,6,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 13, Shape: 10100100010000000000000000000000000000000000, Tiles: [1,3,6,10] hexUtils.ts:207:13
[drawPreviewGrid] Index: 14, Shape: 10100100000010000000000000000000000000000000, Tiles: [1,3,6,13] hexUtils.ts:207:13
[drawPreviewGrid] Index: 15, Shape: 10100000100100000000000000000000000000000000, Tiles: [1,3,9,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 16, Shape: 10100000100010000000000000000000000000000000, Tiles: [1,3,9,13] hexUtils.ts:207:13
[drawPreviewGrid] Index: 17, Shape: 10100000100000010000000000000000000000000000, Tiles: [1,3,9,15] hexUtils.ts:207:13
[drawPreviewGrid] Index: 18, Shape: 10011001000000000000000000000000000000000000, Tiles: [1,4,5,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 19, Shape: 10001100100000000000000000000000000000000000, Tiles: [1,5,6,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 20, Shape: 10001001001000000000000000000000000000000000, Tiles: [1,5,8,11] hexUtils.ts:207:13
[drawPreviewGrid] Index: 21, Shape: 10001001000100000000000000000000000000000000, Tiles: [1,5,8,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 22, Shape: 10001001000000100000000000000000000000000000, Tiles: [1,5,8,14] hexUtils.ts:207:13
[drawPreviewGrid] Index: 23, Shape: 10001000100100000000000000000000000000000000, Tiles: [1,5,9,12] hexUtils.ts:207:13
[drawPreviewGrid] Index: 24, Shape: 10001000100010000000000000000000000000000000, Tiles: [1,5,9,13] hexUtils.ts:207:13
[drawPreviewGrid] Index: 25, Shape: 10001000100000010000000000000000000000000000, Tiles: [1,5,9,15] hexUtils.ts:207:13
[drawPreviewGrid] Index: 26, Shape: 10001000000100100000000000000000000000000000, Tiles: [1,5,12,14] hexUtils.ts:207:13
[drawPreviewGrid] Index: 27, Shape: 10001000000100010000000000000000000000000000, Tiles: [1,5,12,15] hexUtils.ts:207:13
[drawPreviewGrid] Index: 28, Shape: 10001000000100000010000000000000000000000000, Tiles: [1,5,12,24] hexUtils.ts:207:13
[drawPreviewGrid] Index: 29, Shape: 01101100000000000000000000000000000000000000, Tiles: [2,3,5,6] hexUtils.ts:207:13
[drawPreviewGrid] Index: 30, Shape: 01101001000000000000000000000000000000000000, Tiles: [2,3,5,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 31, Shape: 01101000100000000000000000000000000000000000, Tiles: [2,3,5,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 32, Shape: 01010011000000000000000000000000000000000000, Tiles: [2,4,7,8] hexUtils.ts:207:13
[drawPreviewGrid] Index: 33, Shape: 01001100100000000000000000000000000000000000, Tiles: [2,5,6,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 34, Shape: 01001001100000000000000000000000000000000000, Tiles: [2,5,8,9] hexUtils.ts:207:13
[drawPreviewGrid] Index: 35, Shape: 00111001000000000000000000000000000000000000, Tiles: [3,4,5,8] hexUtils.ts:207:13
"""

# --- Parsing and Checking ---
# Regex to find "Tiles: [a,b,c,d]"
tile_pattern = re.compile(r"Tiles: \[(\d+,\d+,\d+,\d+)\]")

disconnected_shapes = []
processed_tile_sets = set() # Keep track of unique tile combinations processed

for line in log_data.strip().split('\n'):
    match = tile_pattern.search(line)
    if match:
        try:
            # Extract IDs and convert to integers
            tile_ids_str = match.group(1).split(',')
            tile_ids = sorted([int(tid) for tid in tile_ids_str])

            # Use frozenset to check if we've already processed this unique combination
            tile_set_frozen = frozenset(tile_ids)
            if tile_set_frozen in processed_tile_sets:
                continue # Skip duplicate combinations from the log
            processed_tile_sets.add(tile_set_frozen)

            # Check connectivity using the 44-tile adjacency list
            if not is_connected(tile_ids, ADJACENT_LIST):
                disconnected_shapes.append(tile_ids)

        except ValueError:
            print(f"Warning: Could not parse tile IDs from line: {line}")
        except Exception as e:
            print(f"Error processing line '{line}': {e}")


# --- Output ---
if disconnected_shapes:
    print("\n-------------------------------------")
    print("Found the following shapes from the log that appear disconnected based on the 44-tile ADJACENT_LIST:")
    # Sort the final list for consistent output
    disconnected_shapes.sort()
    for shape in disconnected_shapes:
        print(f"  - {shape}")
    print("-------------------------------------")
else:
    print("\nAll shapes extracted from the log appear to be connected based on the 44-tile ADJACENT_LIST.")

# Explicit check for the problematic shape from the log
problem_shape = [1, 5, 12, 24]
print(f"\nRe-checking connectivity for {problem_shape}:")
if is_connected(problem_shape, ADJACENT_LIST):
    print(f"  -> {problem_shape} IS connected according to the ADJACENT_LIST.")
else:
    print(f"  -> {problem_shape} is NOT connected according to the ADJACENT_LIST.")