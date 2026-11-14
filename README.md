# Arithmetic Tile Placement Games Solver (ATPG Solver)

## Overview

The **Arithmetic Tile Placement Games Solver (ATPG Solver)** is a Node.js-based computational engine designed to identify and evaluate all legal moves in arithmetic tile placement board games, specifically following standard **A-Math** rules[cite: 2, 4, 5]. Given a 15x15 board configuration and a player's tile rack, the program systematically generates every valid mathematical equation, verifies perpendicular cross-equations, calculates exact scores including board multipliers, and ranks all legal moves in descending order of points.

---

## System Architecture and Algorithm

The solver operates through a five-stage pipeline implemented in `Solver.js`:

### 1. Cross-Check Precomputation
Before initiating the search, the solver iterates over every empty cell `(r, c)` on the 15x15 grid (`precompute` and `getVerticalCrossCheck`). For cells adjacent to existing vertical tiles, the engine tests all candidate numbers (`0` to `20`) and operators (`+`, `-`, `*`, `/`, `=`) to determine which characters can form a syntactically and mathematically valid vertical equation. The resulting set of valid characters is cached for each coordinate, allowing the backtracking search to prune invalid branches immediately[cite: 5].

### 2. Anchor Identification
The `findAnchors` method scans the board to locate "anchor squares"—empty cells directly adjacent (horizontally or vertically) to at least one existing tile on the board[cite: 5]. If the board is completely empty, the center cell `(7, 7)` is designated as the sole starting anchor[cite: 5].Every legal move must cover at least one anchor square[cite: 5].

### 3. Row-Wise Backtracking and Syntax Pruning
For each anchor, `solveSinglePass` determines the leftmost valid starting column and initiates a recursive depth-first search (`backtrack`) across the row[cite: 5]:
- **Tile Merging and Multi-Digit Rules:** Single-digit tiles (`0`–`9`) placed adjacently are merged into multi-digit numbers up to a maximum of 3 digits (`MAX_DIGITS = 3`)[cite: 5]. Multi-digit tiles (`10`–`20`) cannot be merged with other number tiles[cite: 5].
- **Wildcard Expansion:** Wildcard tiles in the rack (`PM`, `MD`, and `BLANK`) are dynamically expanded into all permissible values that satisfy the current cell's precomputed cross-check set[cite: 5].
- **Incremental Syntax Validation (`isSyntaxValidFast`):** At each recursive step, the partial token list is checked to prevent invalid constructs such as leading zeros (e.g., `05`), consecutive operators (except `=-` for negative values following an equals sign), or negative zero (`-0`)[cite: 5].
- **Mathematical Evaluation (`isValidEquationFull`):** Once a placement reaches or passes the target anchor, the complete equation is split by `=` and evaluated using standard order of operations[cite: 5]. Equations with multiple `=` signs are supported, provided all segments evaluate to the same finite numerical value within a floating-point tolerance of `1e-9`[cite: 5].

### 4. Board Transposition for Vertical Moves
To compute vertical placements without duplicating search logic, the solver transposes the 15x15 board matrix (`transpose`) and executes the exact same horizontal search pass[cite: 5]. Resulting coordinates from the vertical pass are mapped back to their original `(row, col)` orientation[cite: 5].

### 5. Scoring and Deduplication
The `calculateFullScore` method computes the total score for each candidate move[cite: 5]:
- **Base Tile Values:** Sums the point values of all tiles in the primary equation and any modified perpendicular cross-equations[cite: 5].
- **Board Multipliers:** Applies symmetric 15x15 bonus squares (**2L** for Double Piece, **3L** for Triple Piece, **2W** for Double Equation, and **3W** for Triple Equation) exclusively to newly placed tiles from the rack[cite: 5].
- **Bingo Bonus:** Adds a **40-point bonus** (`BINGO_BONUS`) if 8 or more tiles are placed from the rack in a single turn[cite: 5].
- **Deduplication:** All horizontal and vertical candidates are verified for board connectivity (`checkConnectivity`), deduplicated via a canonical move signature, and sorted from highest to lowest score[cite: 5].

---

## Tile Specifications and Point Values

| Category | Symbols | Point Value | Behavior / Constraints |
| :--- | :--- | :--- | :--- |
| **Single-Digit Numbers** | `0`, `1`, `2`, `3` | 1 | Can merge with adjacent single-digit tiles (up to 3 digits total)[cite: 5]. |
| **Single-Digit Numbers** | `4`, `5`, `6`, `7`, `8`, `9` | 2 | Can merge with adjacent single-digit tiles (up to 3 digits total)[cite: 5]. |
| **Multi-Digit Numbers** | `10` (2), `11` (4), `12` (3), `13` (6), `14` (4), `15` (4), `16` (4), `17` (6), `18` (4), `19` (7), `20` (5) | 2 – 7 | Standalone number tiles; cannot be adjacent to any other number tile[cite: 5]. |
| **Standard Operators** | `+`, `-`, `*`, `/` | 2 | Standard arithmetic operators[cite: 5]. |
| **Equals Sign** | `=` | 1 | At least one `=` is required per valid equation[cite: 5]. |
| **Plus/Minus Wildcard** | `PM` | 1 | Can represent either `+` or `-`[cite: 5]. |
| **Multiply/Divide Wildcard** | `MD` | 1 | Can represent either `*` or `/`[cite: 5]. |
| **Blank Wildcard** | `BLANK` | 0 | Can represent any number (`0`–`20`) or operator (`+`, `-`, `*`, `/`, `=`)[cite: 5]. |


Getting Started
Prerequisites
Node.js (v14.0.0 or later)

Installation
Clone the repository to your local machine:

Bash
git clone [https://github.com/Damrongpong-P/Arithmetic-Tile-Placement-Games-Solver.git](https://github.com/Damrongpong-P/Arithmetic-Tile-Placement-Games-Solver.git)
cd Arithmetic-Tile-Placement-Games-Solver
No external npm packages are required beyond Node.js built-in modules (fs and perf_hooks).   
index.js
+ 1

Usage
1. Running Test Cases via CLI
Execute index.js using Node.js to run the solver against the configured JSON test file and measure execution performance:   
index.js

Bash
node index.js
Sample Console Output:   
example1.json
+ 1

Plaintext
====================================
Start Solver Testing
2026-11-15T00:00:00.000Z
====================================
[Test Case #1] : edge_right: 0 at (7,11), expect OLD=5 solutions top 0=-0
- Possible answer: 5 solution
- highest score: 0=-0 (point: 4)
- Runtime: 12.3450 ms

====================================
 Total Runtime: 12.3450 ms
2026-11-15T00:00:00.015Z
====================================
To switch test datasets (e.g., to Testcase_game151026.json or testcases_EB_5T.json), modify line 5 in index.js:   
index.js
+ 2

JavaScript
const testCasesFile = fs.readFileSync('Testcase_game151026.json', 'utf-8');
2. Programmatic Integration
You can import the Solver class directly into other JavaScript modules:   
index.js
+ 1

JavaScript
const Solver = require('./Solver');

// Define a 15x15 board (use "" for empty cells)
const board = Array.from({ length: 15 }, () => Array(15).fill(""));

// Define the player's tile rack
const rack = ["5", "*", "4", "=", "20"];

// Initialize and execute the solver
const solver = new Solver(board, rack);
const solutions = solver.run();

// Inspect results
console.log(`Total valid moves: ${solutions.length}`);
if (solutions.length > 0) {
    console.log("Highest scoring move:", solutions[0]);
}
3. Input and Output Data Formats
Input Format (board and rack)
board: A 15x15 two-dimensional array of strings. Empty squares must be represented by an empty string "". Occupied squares contain the tile string (e.g., "0", "15", "+", "=").   
example1.json
+ 4

rack: An array of strings representing the tiles available to the player (e.g., ["0", "3", "5", "+", "=", "BLANK", "PM"]).   
Solver.js
+ 1

Output Format (solutions)
The solver.run() method returns an array of solution objects sorted by score in descending order[cite: 5]:

JSON
[
  {
    "equation": "5*4=20",
    "score": 26,
    "moves": [
      { "r": 7, "c": 5, "tile": "5", "val": "5" },
      { "r": 7, "c": 6, "tile": "*", "val": "*" },
      { "r": 7, "c": 7, "tile": "4", "val": "4" },
      { "r": 7, "c": 8, "tile": "=", "val": "=" },
      { "r": 7, "c": 9, "tile": "20", "val": "20" }
    ]
  }
]
equation (string): The primary equation formed along the row or column[cite: 5].

score (number): The total points awarded for the move, including cross-equations and bonuses[cite: 5].

moves (Array<Object>): The list of tiles placed from the rack during the turn, where r and c denote 0-indexed row and column coordinates (0–14), tile indicates the original rack tile used (e.g., "BLANK" or "5"), and val indicates its assigned value on the board[cite: 5].

Author
Papangkorn Damrongpong

GitHub: https://github.com/Damrongpong-P
