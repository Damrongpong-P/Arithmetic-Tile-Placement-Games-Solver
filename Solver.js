// --- CONSTANTS ---
const TILE_SCORES = {'0':1,'1':1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':2,'8':2,'9':2,'10':2,'11':4,'12':3,'13':6,'14':4,'15':4,'16':4,'17':6,'18':4,'19':7,'20':5,'+':2,'-':2,'*':2,'/':2,'=':1,'BLANK':0,'PM':1,'MD':1};
const OPERATORS_SET = new Set(['+', '-', '*', '/', '=']);
const WILDCARD_RULES = {
    "PM": new Set(["+", "-"]), 
    "MD": new Set(["*", "/"]), 
    "BLANK": new Set(Array.from({length:21}, (_,i)=>String(i)).concat(['+','-','*','/','=']))
};
const MAX_DIGITS = 3;
const BINGO_BONUS = 40;

// --- BOARD MAP ---
const BOARD_MULTIPLIERS = {};
(function initBonusMap() {
    const topLeft = {
        '0,0':'3W', '0,3':'2L', '0,7':'3W', '1,1':'2W', '1,5':'3L', '2,2':'2W', '2,6':'2L',
        '3,0':'2L', '3,3':'2W', '3,7':'3L', '4,4':'3L', '5,1':'3L', '5,5':'3L', '6,2':'2L', '6,6':'2L',
        '7,0':'3W', '7,3':'3L', '7,7':'3L' 
    };
    for(let r=0; r<15; r++){
        for(let c=0; c<15; c++){
            let refR = r <= 7 ? r : 14 - r;
            let refC = c <= 7 ? c : 14 - c;
            let key = refR+','+refC;
            if(topLeft[key]) BOARD_MULTIPLIERS[r+','+c] = topLeft[key];
        }
    }
})();

// --- VALIDATION LOGIC ---
function isSyntaxValidFast(tokens) {
    if(tokens.length === 0) return true;
    
    let last = tokens[tokens.length-1];
    let index = tokens.length - 1;
    let isLastOp = OPERATORS_SET.has(last);

    if (index === 0) {
        if (['+', '*', '/', '='].includes(last)) return false;
    }

    if (last === '0' && index > 0 && tokens[index-1] === '-') {
        if (index === 1) return false;
        let prevPrev = tokens[index-2];
        if (OPERATORS_SET.has(prevPrev)) return false;
    }

    if (!isLastOp) {
        if (last.length > 1 && last.startsWith('0')) return false; 
        if (last.length > MAX_DIGITS) return false;
        if (index > 0) {
            let prev = tokens[index-1];
            if (!OPERATORS_SET.has(prev)) return false; 
        }
    } else {
        if (index > 0) {
            let prev = tokens[index-1];
            if (OPERATORS_SET.has(prev)) {
                if (prev !== '=' || last !== '-') return false;
            }
        }
    }
    return true;
}

function validateEntireSyntax(tokens) {
    if (tokens.length === 0) return false;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        let isOp = OPERATORS_SET.has(token);

        if (i === 0) {
            if (['+', '*', '/', '='].includes(token)) return false;
        }

        if (token === '0' && i > 0 && tokens[i-1] === '-') {
            if (i === 1) return false;
            let prevPrev = tokens[i-2];
            if (OPERATORS_SET.has(prevPrev)) return false;
        }

        if (!isOp) {
            if (token.length > 1 && token.startsWith('0') && token !== '0') return false;
            if (token.length > MAX_DIGITS) return false;
            if (i > 0) {
                let prev = tokens[i-1];
                if (!OPERATORS_SET.has(prev)) return false;
            }
        } else {
            if (i > 0) {
                let prev = tokens[i-1];
                if (OPERATORS_SET.has(prev)) {
                    if (prev !== '=' || token !== '-') return false;
                }
            }
        }
    }
    return true;
}

function safeEval(expr) {
    try { return Function('"use strict"; return (' + expr + ')')(); } catch(e) { return null; }
}

function isValidEquationFull(eqStr) {
    if(!eqStr.includes('=')) return false;
    const sides = eqStr.split('=');
    if(sides.length < 2 || sides.some(s => s.trim() === '')) return false;
    if (OPERATORS_SET.has(eqStr[eqStr.length-1])) return false;

    try {
        let target = safeEval(sides[0]);
        
        if(!Number.isFinite(target)) return false;
        
        for(let i=1; i<sides.length; i++) {
            let val = safeEval(sides[i]);
            if(!Number.isFinite(val)) return false;
            if (Math.abs(val - target) > 1e-9) return false;
        }
        return true;
    } catch(e) { return false; }
}

// --- SOLVER ---
class Solver {
    constructor(board, rack) {
        this.originalBoard = board;
        this.board = JSON.parse(JSON.stringify(board));
        this.rack = rack.sort();
        this.solutions = [];
        this.crossChecks = {};
        this.rows = 15; this.cols = 15;
        this.totalAnchors = 0;
        this.doneAnchors = 0;
    }

    transpose(b) { return b[0].map((_, colIndex) => b.map(row => row[colIndex])); }

    getVerticalCrossCheck(r, c) {
        let up = (r-1 >= 0) ? this.board[r-1][c] : "";
        let down = (r+1 < this.rows) ? this.board[r+1][c] : "";
        const isNum = (v) => v !== "" && !OPERATORS_SET.has(v);

        if (up === "" && down === "") {
            let set = new Set(Object.keys(TILE_SCORES));
            OPERATORS_SET.forEach(op => set.add(op));
            return set;
        }

        let valid = new Set();
        let candidates = [];
        for(let i=0; i<=20; i++) candidates.push(String(i));
        OPERATORS_SET.forEach(op => candidates.push(op));

        for(let char of candidates) {
            let isCandidateNum = !OPERATORS_SET.has(char);
            if (isCandidateNum) {
                if (char.length > 1) { 
                    if (isNum(up) || isNum(down)) continue; 
                } else { 
                    if (isNum(up) && up.length > 1) continue;
                    if (isNum(down) && down.length > 1) continue;
                }
            }
            
            let tempWord = char;
            let curr = r - 1;
            while(curr >= 0 && this.board[curr][c] !== "") { 
                tempWord = this.board[curr][c] + tempWord; 
                curr--; 
            }
            curr = r + 1;
            while(curr < this.rows && this.board[curr][c] !== "") { 
                tempWord = tempWord + this.board[curr][c]; 
                curr++; 
            }

            if(tempWord.length > 1) {
                let tokens = tempWord.match(/(\d+|[\+\-\*\/\=])/g);
                if (!tokens) continue;
                if(!validateEntireSyntax(tokens)) continue; 
                if(!tempWord.includes('=')) continue;
                if(!isValidEquationFull(tempWord)) continue;
            }
            valid.add(char);
        }
        return valid;
    }

    precompute() {
        this.crossChecks = {};
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                if(this.board[r][c] === "") {
                    this.crossChecks[r+','+c] = this.getVerticalCrossCheck(r, c);
                }
            }
        }
    }

    findAnchors() {
        let isEmpty = true;
        for(let r=0; r<15; r++) { for(let c=0; c<15; c++) { if(this.board[r][c] !== "") { isEmpty = false; break; } } if(!isEmpty) break; }
        let anchors = [];
        if(isEmpty) { anchors.push({r:7, c:7}); return anchors; } 
        
        for(let r=0; r<15; r++) {
            for(let c=0; c<15; c++) {
                if(this.board[r][c] === "") {
                    let hasNeighbor = false;
                    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
                    for(let d of dirs) {
                        let nr = r + d[0], nc = c + d[1];
                        if(nr>=0 && nr<15 && nc>=0 && nc<15 && this.board[nr][nc] !== "") { hasNeighbor = true; break; }
                    }
                    if(hasNeighbor) anchors.push({r:r, c:c});
                }
            }
        }
        return anchors;
    }

    solveSinglePass(mode) {
        this.solutions = [];
        this.precompute();
        let anchors = this.findAnchors();
        this.totalAnchors = anchors.length;
        this.doneAnchors = 0;
        
        if(anchors.length === 0) return [];

        for(let anchor of anchors) {
            let r = anchor.r, c = anchor.c;
            
            let limit = c;
            while (limit > 0 && this.board[r][limit - 1] !== "") {
                limit--;
            }
            let startMin = Math.max(0, limit - this.rack.length);
            let startMax = limit + 1;

            for(let startCol = startMin; startCol < startMax; startCol++) {
                if(startCol > 0 && this.board[r][startCol-1] !== "") continue;
                this.backtrack(r, startCol, this.rack, [], [], false, false, c);
            }
            
            this.doneAnchors++;
        }
        return this.solutions;
    }

    backtrack(r, c, currentRack, currentTokens, placedMoves, anchorMet, lastMergeable, targetAnchorCol) {
        if(c >= this.cols) { this.finalizeMove(currentTokens, currentRack, placedMoves, anchorMet); return; }
        
        if(!isSyntaxValidFast(currentTokens)) return;

        let cellContent = this.board[r][c];
        
        if(cellContent !== "") {
            let newTokens = [...currentTokens];
            let nextMergeable = false;
            
            let isOp = OPERATORS_SET.has(cellContent);
            let isMulti = cellContent.length > 1;

            if(isOp) { 
                newTokens.push(cellContent); 
                nextMergeable = false; 
            } 
            else if (isMulti) { 
                newTokens.push(cellContent); 
                nextMergeable = false; 
            }
            else {
                if(lastMergeable && newTokens.length > 0) {
                    if(newTokens[newTokens.length-1].length + cellContent.length <= MAX_DIGITS) {
                        newTokens[newTokens.length-1] += cellContent; 
                        nextMergeable = true;
                    } else { 
                        newTokens.push(cellContent); 
                        nextMergeable = true; 
                    }
                } else { 
                    newTokens.push(cellContent); 
                    nextMergeable = true; 
                }
            }
            
            if(newTokens.length > 1) {
                let last = newTokens[newTokens.length-1];
                let prev = newTokens[newTokens.length-2];
                if(!OPERATORS_SET.has(last) && !OPERATORS_SET.has(prev)) return;
            }
            
            let newAnchorMet = anchorMet || (c === targetAnchorCol);
            this.backtrack(r, c+1, currentRack, newTokens, placedMoves, newAnchorMet, nextMergeable, targetAnchorCol);

        } else {
            let newAnchorMet = anchorMet || (c === targetAnchorCol);
            if(newAnchorMet && currentTokens.length > 0) {
                this.finalizeMove(currentTokens, currentRack, placedMoves, newAnchorMet);
            }

            let allowed = this.crossChecks[r+','+c] || new Set();
            let uniqueTiles = new Set(currentRack);

            for(let tile of uniqueTiles) {
                let validExpansions = new Set();
                if(WILDCARD_RULES[tile]) {
                    let potential = WILDCARD_RULES[tile];
                    for(let val of potential) { if(allowed.has(val)) validExpansions.add(val); }
                } else { 
                    if(allowed.has(tile)) validExpansions.add(tile); 
                }
                
                for(let val of validExpansions) {
                    let newTokens = [...currentTokens];
                    let nextMergeable = false;
                    
                    let isOp = OPERATORS_SET.has(val);
                    let isMulti = val.length > 1;

                    if(isOp) { 
                        newTokens.push(val); 
                        nextMergeable = false; 
                    } 
                    else if (isMulti) {
                        newTokens.push(val);
                        nextMergeable = false;
                    }
                    else {
                        if(lastMergeable && newTokens.length > 0) {
                            if(newTokens[newTokens.length-1].length + val.length <= MAX_DIGITS) {
                                newTokens[newTokens.length-1] += val; 
                                nextMergeable = true;
                            } else { 
                                newTokens.push(val); 
                                nextMergeable = true; 
                            }
                        } else { 
                            newTokens.push(val); 
                            nextMergeable = true; 
                        }
                    }

                    if(newTokens.length > 1) {
                        let last = newTokens[newTokens.length-1];
                        let prev = newTokens[newTokens.length-2];
                        if(!OPERATORS_SET.has(last) && !OPERATORS_SET.has(prev)) continue;
                    }

                    let newRack = [...currentRack];
                    let idx = newRack.indexOf(tile);
                    if(idx > -1) newRack.splice(idx, 1);
                    
                    let newMoves = [...placedMoves, {r:r, c:c, tile:tile, val:val}];
                    this.backtrack(r, c+1, newRack, newTokens, newMoves, newAnchorMet, nextMergeable, targetAnchorCol);
                }
            }
        }
    }

    finalizeMove(tokens, rack, moves, anchorMet) {
        if(!anchorMet || moves.length === 0) return;
        if(!validateEntireSyntax(tokens)) return;
        let fullWord = tokens.join("");
        if(isValidEquationFull(fullWord)) { 
            this.solutions.push({equation: fullWord, moves: moves}); 
        }
    }

    calculateFullScore(placedMoves) {
        let totalScore = 0;
        if(!placedMoves || placedMoves.length === 0) return 0;
        
        let r0 = placedMoves[0].r, c0 = placedMoves[0].c;
        let isHorizontal = true;
        if(placedMoves.length > 1) { 
            isHorizontal = (placedMoves[0].r === placedMoves[1].r); 
        } else {
            let hasLeft = (c0 > 0 && this.originalBoard[r0][c0-1] !== "");
            let hasRight = (c0 < 14 && this.originalBoard[r0][c0+1] !== "");
            isHorizontal = (hasLeft || hasRight);
        }

        let movesMap = {};
        placedMoves.forEach(m => movesMap[m.r+','+m.c] = {name: m.tile, val: m.val});

        const getLineScore = (r, c, dr, dc) => {
            let currR = r, currC = c;
            while(currR - dr >= 0 && currR - dr < 15 && currC - dc >= 0 && currC - dc < 15) {
                let pr = currR - dr, pc = currC - dc;
                if(this.originalBoard[pr][pc] !== "" || movesMap[pr+','+pc]) { currR = pr; currC = pc; } else break;
            }
            
            let score = 0; 
            let mult = 1;
            let tilesCount = 0;

            while(currR >= 0 && currR < 15 && currC >= 0 && currC < 15) {
                let key = currR+','+currC;
                if(movesMap[key]) {
                    let info = movesMap[key];
                    let pts = TILE_SCORES[info.name] || 0;
                    let bonus = BOARD_MULTIPLIERS[key];
                    
                    if(bonus === '2L') pts *= 2; 
                    else if(bonus === '3L') pts *= 3;
                    else if(bonus === '2W') mult *= 2; 
                    else if(bonus === '3W') mult *= 3;
                    
                    score += pts;
                    tilesCount++;
                } else if(this.originalBoard[currR][currC] !== "") {
                    let name = this.originalBoard[currR][currC]; 
                    score += (TILE_SCORES[name] || 0);
                    tilesCount++;
                } else {
                    break; 
                }
                currR += dr; currC += dc;
            }
            return (tilesCount > 1) ? score * mult : 0;
        };

        let dr = isHorizontal ? 0 : 1; 
        let dc = isHorizontal ? 1 : 0;
        totalScore += getLineScore(r0, c0, dr, dc);

        let crossDr = isHorizontal ? 1 : 0; 
        let crossDc = isHorizontal ? 0 : 1;
        
        for(let m of placedMoves) {
            let r = m.r, c = m.c;
            let hasPrev = (r-crossDr >=0 && c-crossDc >=0 && this.originalBoard[r-crossDr][c-crossDc] !== "");
            let hasNext = (r+crossDr <15 && c+crossDc <15 && this.originalBoard[r+crossDr][c+crossDc] !== "");
            
            if(hasPrev || hasNext) { 
                totalScore += getLineScore(r, c, crossDr, crossDc); 
            }
        }

        if(placedMoves.length >= 8) totalScore += BINGO_BONUS;
        
        return totalScore;
    }

    checkConnectivity(placedMoves) {
        let isEmpty = true;
        for(let r=0; r<15; r++) { for(let c=0; c<15; c++) { if(this.originalBoard[r][c] !== "") { isEmpty = false; break; } } if(!isEmpty) break; }
        if(isEmpty) { for(let m of placedMoves) { if(m.r === 7 && m.c === 7) return true; } return false; }
        let connected = false;
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        for(let m of placedMoves) {
            for(let d of dirs) {
                let nr = m.r + d[0], nc = m.c + d[1];
                if(nr>=0 && nr<15 && nc>=0 && nc<15) { 
                    if(this.originalBoard[nr][nc] !== "") { connected = true; break; } 
                }
            }
            if(connected) break;
        }
        return connected;
    }

    run() {
        this.board = JSON.parse(JSON.stringify(this.originalBoard));
        this.totalAnchors = 0; 
        
        // Solve Horizontal
        let hMovesRaw = this.solveSinglePass("H");
        let hFinal = hMovesRaw.map(res => {
            let score = this.calculateFullScore(res.moves);
            return {equation: res.equation, score: score, moves: res.moves};
        });

        // Solve Vertical
        let tBoard = this.transpose(this.originalBoard);
        this.board = JSON.parse(JSON.stringify(tBoard)); 
        this.rows = 15; this.cols = 15; 
        let vMovesRaw = this.solveSinglePass("V");
        let vFinal = vMovesRaw.map(res => {
            let newMoves = res.moves.map(m => ({r: m.c, c: m.r, tile: m.tile, val: m.val}));
            let score = this.calculateFullScore(newMoves); 
            return {equation: res.equation, score: score, moves: newMoves};
        });

        // Merge & Sort
        let allCandidates = [...hFinal, ...vFinal];
        allCandidates.sort((a,b) => b.score - a.score);
        
        let seen = new Set();
        let finalSolutions = [];
        
        for(let cand of allCandidates) {
            if(!this.checkConnectivity(cand.moves)) continue;
            let sigArr = cand.moves.map(m => `${m.r},${m.c},${m.tile},${m.val}`).sort();
            let sig = sigArr.join('|');
            if(!seen.has(sig)) { 
                seen.add(sig); 
                finalSolutions.push(cand); 
            }
        }
        return finalSolutions;
    }
}


module.exports = Solver;