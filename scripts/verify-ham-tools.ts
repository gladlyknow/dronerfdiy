import { examCallsignDistricts } from '../src/data/aKnowledgeData';
import { getBank } from '../src/data/bankData';
import { qCodesData } from '../src/data/hamData';

const normalize = (value: string) => value.replace(/\s+/g, ' ').replace(/[？]/g, '?').trim().toUpperCase();
const a = getBank('A');
const phrases = a.filter((q) => q.sectionCode === '2.4.1');
const cw = a.filter((q) => q.sectionCode === '2.4.2');
const expected: Record<string, string> = {
  'MC1-0346': 'PSE QRQ', 'MC1-0348': 'PSE QRS', 'MC1-0351': 'QRU?', 'MC1-0352': 'QRU',
  'MC1-0353': 'QRV IN WAPC?', 'MC1-0357': 'QSA', 'MC1-0361': 'QSD AT Y',
  'MC1-0362': 'QSD PSE CK', 'MC1-0370': 'QSX FT8 ON 7074 KHZ',
};
const expectedCw: Record<string, string> = {
  'MC1-0376': 'AGN', 'MC1-0377': '另一个', 'MC1-0378': 'ARDF',
};
if (qCodesData.length !== 21 || new Set(qCodesData.map((q) => q.code)).size !== 21) throw new Error('core Q code set must contain 21 unique entries');
for (const code of ['QRQ','QRS','QRU','QSA','QSD','QSK','QSX']) if (!qCodesData.some((q) => q.code === code)) throw new Error(`missing core code ${code}`);
if (phrases.length !== 31 || cw.length !== 51) throw new Error(`A section counts: 2.4.1=${phrases.length}, 2.4.2=${cw.length}`);
for (const [id, text] of Object.entries(expected)) {
  const question = phrases.find((q) => q.id === id);
  const answer = question?.answerType.split('').map((key) => question.options.find((o) => o.key === key)?.text || '').join('；') || '';
  if (normalize(answer) !== normalize(text)) throw new Error(`${id}: expected ${text}, got ${answer}`);
}
for (const [id, text] of Object.entries(expectedCw)) {
  const question = cw.find((q) => q.id === id);
  const answer = question?.answerType.split('').map((key) => question.options.find((o) => o.key === key)?.text || '').join('；') || '';
  if (normalize(answer) !== normalize(text)) throw new Error(`${id}: expected ${text}, got ${answer}`);
}
if (!cw.some((q) => q.id === 'MC1-0377' && normalize(q.question).includes('AHR'))) throw new Error('MC1-0377 must index AHR');
if (examCallsignDistricts.length !== 10 || examCallsignDistricts.reduce((sum, zone) => sum + zone.provinces.length, 0) !== 31) throw new Error('callsign zones must be 10 / 31');
console.log('HAM tools: OK — 21 core Q codes, 31 phrases, 51 CW abbreviations, 10 zones / 31 provinces');
