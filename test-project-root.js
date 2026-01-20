// Test projectRoot calculation
const path = require('path');

const runDir = 'C:\\Users\\tmusk\\IdeaProjects\\babysitter\\.a5c\\runs\\test-hooks-final-1768842754';
const projectRoot = path.dirname(path.dirname(runDir));

console.log('runDir:', runDir);
console.log('projectRoot:', projectRoot);
console.log('Expected project root: C:\\Users\\tmusk\\IdeaProjects\\babysitter');
console.log('Matches:', projectRoot === 'C:\\Users\\tmusk\\IdeaProjects\\babysitter');
