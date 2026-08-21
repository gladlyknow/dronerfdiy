import { getBank, getBankIntegrity } from '../src/data/bankData';

const expected = {
  A: { pages: 165, count: 683, sections: 51, sha256: '871cf0290e5d89da926216f95eeecbc2ef46a5d8a10eaa2a29dab018736d14a3' },
  B: { pages: 277, count: 1143, sections: 95, sha256: '492eaaa1e2d56b90923cd2ba13c901c0fc18e9c037db50462dafeb81b707a34b' },
  C: { pages: 309, count: 1282, sections: 104, sha256: '94c525cdadf210ac3d183d17c80d9bef829eebcf1fe93e550917e5e39b5d0098' },
} as const;

for (const level of ['A', 'B', 'C'] as const) {
  const bank = getBank(level);
  const integrity = getBankIntegrity(level);
  const target = expected[level];

  if (integrity.pages !== target.pages) throw new Error(`${level}: PDF page count changed ${integrity.pages} != ${target.pages}`);
  if (integrity.sha256 !== target.sha256) throw new Error(`${level}: R2 PDF SHA-256 changed; review and re-import before deploy`);
  if (integrity.count !== target.count || bank.length !== target.count) throw new Error(`${level}: question count mismatch`);
  if (integrity.sections !== target.sections) throw new Error(`${level}: section count mismatch`);
  if (integrity.uniqueIds !== target.count) throw new Error(`${level}: [I] IDs are not unique`);
  if (integrity.missingFields !== 0) throw new Error(`${level}: source fields are missing`);
  if (integrity.sectionTotal !== target.count) throw new Error(`${level}: section totals do not sum to bank count`);
  if (!integrity.isComplete) throw new Error(`${level}: runtime integrity check failed`);

  const ids = new Set<string>();
  for (const q of bank) {
    if (!q.id || !q.jCode || !q.sectionCode || !q.question || !q.answerType) throw new Error(`${level}: missing required field at ${q.id || 'unknown'}`);
    if (ids.has(q.id)) throw new Error(`${level}: duplicate [I] ${q.id}`);
    ids.add(q.id);
    if (!/^[ABCD]+$/.test(q.answerType)) throw new Error(`${level}: invalid [T] answer at ${q.id}`);
    if (q.options.length !== 4 || q.options.some((option) => !option.text)) throw new Error(`${level}: incomplete [A-D] options at ${q.id}`);
  }

  console.log(`${level}: OK — ${bank.length} questions, ${integrity.sections} sections, ${integrity.singles} single, ${integrity.multiples} multiple, ${integrity.pages} PDF pages`);
}

console.log('R2 ABC authoritative bank verification passed.');
