import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const terms = ['Q2xhdWRl','QW50aHJvcGlj','Q29kZXg=','T3BlbkFJ','R2VuZXJhdGVkIHdpdGg=','Q28tQXV0aG9yZWQtQnk=','U2Vzc2lvbg=='].map(t=>Buffer.from(t,'base64').toString());
const pattern = new RegExp(terms.join('|'),'i');
function check(value, label) {
  if (pattern.test(value)) { console.error(`Publication text check failed: ${label}. Remove authorship metadata or review the matching product reference.`); process.exit(1); }
}
if (process.argv[2] === '--message') {
  check(readFileSync(process.argv[3],'utf8'),'commit message');
} else {
  const base = process.env.SCAN_BASE || 'origin/main';
  const messages = execFileSync('git',['log',`${base}..HEAD`,'--format=%B'],{encoding:'utf8'});
  const diff = execFileSync('git',['diff',base],{encoding:'utf8',maxBuffer:10*1024*1024});
  check(messages,'new commit messages'); check(diff,'diff');
  if (process.argv[2] === '--body') check(readFileSync(process.argv[3],'utf8'),'pull request body');
  console.log('Publication text check passed.');
}
