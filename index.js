const fs = require('fs');
const { performance } = require('perf_hooks');
const Solver = require('./Solver');

const testCasesFile = fs.readFileSync('example1.json', 'utf-8');
const testCases = JSON.parse(testCasesFile);

let totalRuntime = 0;
console.log('====================================');
console.log('Start Solver Testing');
console.log(new Date().toISOString());
console.log('====================================');

testCases.forEach((tc, index) => {
    console.log(`[Test Case #${index + 1}] : ${tc.name}`);
    const solver = new Solver(tc.board, tc.rack);
    const startTime = performance.now();
    const solutions = solver.run();
    const endTime = performance.now();
    const runTime = endTime - startTime;
    totalRuntime += runTime;
    console.log(`- Possible answer: ${solutions.length} solution`);
    if (solutions.length > 0) {
        console.log(`- highest score: ${solutions[0].equation} (point: ${solutions[0].score})`);
    }
    console.log(`- Runtime: ${runTime.toFixed(4)} ms\n`);
});

console.log('====================================');
console.log(` Total Runtime: ${totalRuntime.toFixed(4)} ms`);
console.log(new Date().toISOString());
console.log('====================================');