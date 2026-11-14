# Arithmetic Tile Placement Games Solver (ATPG Solver)

> [!IMPORTANT]
> ### Official Notice: Academic Portfolio Submission & Temporary Public Access
> 
> This repository and its accompanying web-based computation platform have been developed and compiled as part of an official academic portfolio submission to <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=15&pause=1000&color=DE5C8E&vCenter=true&multiline=false&repeat=false&width=205&height=20&lines=Chulalongkorn+University" align="absmiddle" alt="Chulalongkorn University" />.
> 
> **System Access Policy & Evaluation Guidelines:**
> - **Standard Operation:** Under normal operating conditions, the production web application is restricted to authorized internal users to manage server computation loads and maintain session security.
> - **Portfolio Review Period:** To facilitate direct technical evaluation, **unrestricted complimentary access has been temporarily enabled** for <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=15&pause=1000&color=DE5C8E&vCenter=true&multiline=false&repeat=false&width=205&height=20&lines=Chulalongkorn+University" align="absmiddle" alt="Chulalongkorn University" /> admission committees, faculty reviewers, and external evaluators.
> - **Authentication Method:** No manual account registration or administrative approval is required during this period. Evaluators can immediately access all solver features via Google OAuth 2.0 by signing in with any standard Google account (`@gmail.com`).
> 
> **Live Web Application:** <a href="https://tilemath.web.app" target="_blank"><img src="https://img.shields.io/badge/tilemath.web.app-8A1538?style=flat-square&logo=googlechrome&logoColor=white" align="absmiddle" alt="tilemath.web.app" /></a>

## Overview

The **Arithmetic Tile Placement Games Solver (ATPG Solver)** is a Node.js-based computational engine designed to identify and evaluate all legal moves in arithmetic tile placement board games, specifically following standard **A-Math** rules. Given a 15x15 board configuration and a player's tile rack, the program systematically generates every valid mathematical equation, verifies perpendicular cross-equations, calculates exact scores including board multipliers, and ranks all legal moves in descending order of points.

---

## System Architecture and Algorithm

The solver operates through a five-stage pipeline implemented in `Solver.js`:

### 1. Cross-Check Precomputation
Before initiating the search, the solver iterates over every empty cell `(r, c)` on the 15x15 grid (`precompute` and `getVerticalCrossCheck`). For cells adjacent to existing vertical tiles, the engine tests all candidate numbers (`0` to `20`) and operators (`+`, `-`, `*`, `/`, `=`) to determine which characters can form a syntactically and mathematically valid vertical equation. The resulting set of valid characters is cached for each coordinate, allowing the backtracking search to prune invalid branches immediately.

### 2. Anchor Identification
The `findAnchors` method scans the board to locate "anchor squares"—empty cells directly adjacent (horizontally or vertically) to at least one existing tile on the board. If the board is completely empty, the center cell `(7, 7)` is designated as the sole starting anchor. Every legal move must cover at least one anchor square.

### 3. Row-Wise Backtracking and Syntax Pruning
For each anchor, `solveSinglePass` determines the leftmost valid starting column and initiates a recursive depth-first search (`backtrack`) across the row:
- **Tile Merging and Multi-Digit Rules:** Single-digit tiles (`0`–`9`) placed adjacently are merged into multi-digit numbers up to a maximum of 3 digits (`MAX_DIGITS = 3`). Multi-digit tiles (`10`–`20`) cannot be merged with other number tiles.
- **Wildcard Expansion:** Wildcard tiles in the rack (`PM`, `MD`, and `BLANK`) are dynamically expanded into all permissible values that satisfy the current cell's precomputed cross-check set.
- **Incremental Syntax Validation (`isSyntaxValidFast`):** At each recursive step, the partial token list is checked to prevent invalid constructs such as leading zeros (e.g., `05`), consecutive operators (except `=-` for negative values following an equals sign), or negative zero (`-0`).
- **Mathematical Evaluation (`isValidEquationFull`):** Once a placement reaches or passes the target anchor, the complete equation is split by `=` and evaluated using standard order of operations. Equations with multiple `=` signs are supported, provided all segments evaluate to the same finite numerical value within a floating-point tolerance of `1e-9`.

### 4. Board Transposition for Vertical Moves
To compute vertical placements without duplicating search logic, the solver transposes the 15x15 board matrix (`transpose`) and executes the exact same horizontal search pass. Resulting coordinates from the vertical pass are mapped back to their original `(row, col)` orientation.

### 5. Scoring and Deduplication
The `calculateFullScore` method computes the total score for each candidate move:
- **Base Tile Values:** Sums the point values of all tiles in the primary equation and any modified perpendicular cross-equations.
- **Board Multipliers:** Applies symmetric 15x15 bonus squares (**2L** for Double Piece, **3L** for Triple Piece, **2W** for Double Equation, and **3W** for Triple Equation) exclusively to newly placed tiles from the rack.
- **Bingo Bonus:** Adds a **40-point bonus** (`BINGO_BONUS`) if 8 or more tiles are placed from the rack in a single turn.
- **Deduplication:** All horizontal and vertical candidates are verified for board connectivity (`checkConnectivity`), deduplicated via a canonical move signature, and sorted from highest to lowest score.

---

## Tile Specifications and Point Values

| Category | Symbols | Point Value | Behavior / Constraints |
| :--- | :--- | :--- | :--- |
| **Single-Digit Numbers** | `0`, `1`, `2`, `3` | 1 | Can merge with adjacent single-digit tiles (up to 3 digits total). |
| **Single-Digit Numbers** | `4`, `5`, `6`, `7`, `8`, `9` | 2 | Can merge with adjacent single-digit tiles (up to 3 digits total). |
| **Multi-Digit Numbers** | `10` (2), `11` (4), `12` (3), `13` (6), `14` (4), `15` (4), `16` (4), `17` (6), `18` (4), `19` (7), `20` (5) | 2 – 7 | Standalone number tiles; cannot be adjacent to any other number tile. |
| **Standard Operators** | `+`, `-`, `*`, `/` | 2 | Standard arithmetic operators. |
| **Equals Sign** | `=` | 1 | At least one `=` is required per valid equation. |
| **Plus/Minus Wildcard** | `PM` | 1 | Can represent either `+` or `-`. |
| **Multiply/Divide Wildcard** | `MD` | 1 | Can represent either `*` or `/`. |
| **Blank Wildcard** | `BLANK` | 0 | Can represent any number (`0`–`20`) or operator (`+`, `-`, `*`, `/`, `=`). |

---

## Project Structure

```text
├── Solver.js                  # Core Solver class, syntax/math validators, and scoring logic
├── index.js                   # CLI test runner and execution time benchmark script
├── Testcase_game151026.json   # Complex mid-game board state with an 8-tile rack
├── testcases_EB_5T.json       # Empty-board test suite for 5-tile equations
├── example1.json              # Syntax and edge-case validation test
└── package.json               # Node.js package metadata
```

---

## Getting Started

### Prerequisites
- **Node.js** (v14.0.0 or later)

### Installation
Clone the repository to your local machine:
```bash
git clone https://github.com/Damrongpong-P/Arithmetic-Tile-Placement-Games-Solver.git
cd Arithmetic-Tile-Placement-Games-Solver
```
No external npm packages are required beyond Node.js built-in modules (`fs` and `perf_hooks`).

---

## Benchmark Showcase: Real Mid-Game Scenario (`Testcase_game151026.json`)

This test case demonstrates the solver evaluating a complex mid-game board state (`real game on 15/10/26`) with an 8-tile rack: `["0", "3", "5", "6", "8", "-", "/", "="]`.

### 1. Initial Board State and Optimal Move Visualization
In the 15x15 grid below, tiles enclosed in brackets `[ ]` indicate the optimal 8-tile Bingo placement found by the solver along **Row 11**, forming `690/138-0=5` across the board while connecting with existing vertical equations:

```text
     0    1    2    3    4    5    6    7    8    9   10   11   12   13   14
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
0 |  9 |    |    |    |    |    |    | 12 |    |    |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
1 |  3 |    |    |    |    |    | 12 |  = |  8 |  7 |  - |  7 |  6 |  + |  1 |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
2 |  - |    |    |    |    |    |    |  4 |    |    |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
3 | 15 |    |    | 11 |  = |  1 |  1 |  + |  0 |  / |  2 |  7 |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
4 |  = |    |    |    |    |  = |    |  8 |    |    |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
5 | 13 |    |    |    |    |  9 |    |    |    |  4 |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
6 |  * |    | 20 |    |    |  - |    |    |    |  = |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
7 |  6 |  2 |  + | 18 |  - |  4 |  = | 16 |  / |  4 |  * | 19 |  + |  0 |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
8 |    |    |  5 |    |    |  * |    |    |    |  + |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
9 |    |    |  + |    |    |  2 |    |    |    |  0 |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
10|    |    |  2 |    |    |  / |    |    |    |  * |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
11| [6]| [9]|  9 | [/]| [1]|  1 | [8]| [-]|  0 |  0 | [=]| [5]|    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
12|    |    |  = |    |    |    |    |    |    |  * |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
13|    |    |  5 |    |    |    |    |    |    | 10 |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
14|  9 |  * |  4 |  = |  4 |  7 |  - |  1 |  1 |    |    |    |    |    |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
```
<img width="1108" height="1477" alt="LINE_ALBUM_Best play_261115_1" src="https://github.com/user-attachments/assets/cd22e1ae-a7fd-4399-ac94-10d6a525603b" />


*(Note: On Row 11, placing `[6]`, `[0]` around `9` at `(11,2)`, `[/]`, `[3]`, `[8]` around `1` at `(11,5)`, `[-]` before `0` at `(11,9)`, and `[=]`, `[5]` forms the 11-tile equation `690/138-0=5`, utilizing all 8 rack tiles `6`, `0`, `/`, `3`, `8`, `-`, `=`, `5` to achieve a 124-point Bingo.)*

### 2. Execution Output
Running `node index.js` with `Testcase_game151026.json` produces the following benchmark result:

```text
====================================
Start Solver Testing
2026-11-14T19:48:41.958Z
====================================
[Test Case #1] : real game on 15/10/26
- Possible answer: 557 solution
- highest score: 690/138-0=5 (point: 124)
- Runtime: 2543.4500 ms

====================================
 Total Runtime: 2543.4500 ms
2026-11-14T19:48:44.505Z
====================================
```

---

## Usage and Additional Test Suites

### 1. Running Test Cases via CLI
Execute `index.js` using Node.js to run the solver against the configured JSON test file:
```bash
node index.js
```

To switch between the included test suites (`Testcase_game151026.json`, `testcases_EB_5T.json`, or `example1.json`), update line 5 in `index.js`:
```javascript
const testCasesFile = fs.readFileSync('Testcase_game151026.json', 'utf-8');
```

### 2. Other Included Test Files
- **`testcases_EB_5T.json` (Empty Board Opening Moves):** Tests opening move generation across the center square `(7, 7)` using 5-tile racks (`["1", "+", "2", "=", "3"]`, `["5", "*", "4", "=", "20"]`, `["12", "*", "6", "=", "2"]`, and `["2", "*", "10", "=", "20"]`).
- **`example1.json` (Edge-Case Validation):** Verifies strict syntax pruning rules around zero and negative signs (`rack: ["=", "-", "0"]` with `"0"` placed at `(7, 11)`).

### 3. Programmatic Integration
You can import the `Solver` class directly into custom JavaScript applications:

```javascript
const Solver = require('./Solver');

// 1. Define a 15x15 board ("" represents an empty cell)
const board = Array.from({ length: 15 }, () => Array(15).fill(""));

// Place an opening equation on row 7: 16 / 4 = 4
board[7][5] = "16";
board[7][6] = "/";
board[7][7] = "4";
board[7][8] = "=";
board[7][9] = "4";

// 2. Define the player's 8-tile rack (including wildcards)
const rack = ["12", "3", "9", "+", "*", "=", "PM", "BLANK"];

// 3. Initialize and execute the solver
const solver = new Solver(board, rack);
const solutions = solver.run();

// 4. Inspect top-scoring results
console.log(`Total legal moves found: ${solutions.length}`);
if (solutions.length > 0) {
    console.log("Optimal Move:", solutions[0]);
}
```

### 4. Input and Output Data Formats

#### Input Format (`board` and `rack`)
- `board`: A 15x15 two-dimensional array of strings. Empty squares must be represented by an empty string `""`. Occupied squares contain the tile string (e.g., `"0"`, `"15"`, `"+"`, `"="`).
- `rack`: An array of strings representing the tiles available to the player (e.g., `["0", "3", "5", "6", "8", "-", "/", "="]`).

#### Output Format (`solutions`)
The `solver.run()` method returns an array of solution objects sorted by `score` in descending order:
```json
[
  {
    "equation": "690/138-0=5",
    "score": 124,
    "moves": [
      { "r": 11, "c": 1, "tile": "6", "val": "6" },
      { "r": 11, "c": 3, "tile": "0", "val": "0" },
      { "r": 11, "c": 4, "tile": "/", "val": "/" },
      { "r": 11, "c": 6, "tile": "3", "val": "3" },
      { "r": 11, "c": 7, "tile": "8", "val": "8" },
      { "r": 11, "c": 8, "tile": "-", "val": "-" },
      { "r": 11, "c": 10, "tile": "=", "val": "=" },
      { "r": 11, "c": 11, "tile": "5", "val": "5" }
    ]
  }
]
```
- `equation` (`string`): The primary equation formed along the row or column.
- `score` (`number`): The total points awarded for the move, including cross-equations, board multipliers, and Bingo bonuses.
- `moves` (`Array<Object>`): The list of tiles placed from the rack during the turn, where `r` and `c` denote 0-indexed row and column coordinates (`0`–`14`), `tile` indicates the original rack tile used, and `val` indicates its assigned value on the board.

---

## Documentation & Generative AI Disclosure

Generative AI (**Gemini Argon**) was utilized **solely to assist in structuring, drafting, and formatting this `README.md` documentation**. All core algorithms, data structures, mathematical validation logic, and software implementations in this repository are the original work of the author. Every section of this documentation has been carefully reviewed, edited, and verified for technical accuracy by the author prior to publication.

---

## Author

**Papangkorn Damrongpong**  
GitHub: [https://github.com/Damrongpong-P](https://github.com/Damrongpong-P)
