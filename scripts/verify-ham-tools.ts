import { examCallsignDistricts } from '../src/data/aKnowledgeData';
import { getBank } from '../src/data/bankData';
import { CHINA_MAP_REGIONS, SOUTH_CHINA_SEA_PATHS } from '../src/data/chinaProvinceGeometry';
import { qCodesData } from '../src/data/hamData';
import { communicationAbbreviations, hamTerms } from '../src/data/hamDictionaryData';
import { allocationRules, frequencyAllocations, frequencyUseWindows } from '../src/data/frequencyAllocationData';

const normalize = (value: string) => value.replace(/\s+/g, ' ').replace(/[？]/g, '?').trim().toUpperCase();
const a = getBank('A');
const phrases = a.filter((q) => q.sectionCode === '2.4.1');
const cw = a.filter((q) => q.sectionCode === '2.4.2');
const frequencyAllocationQuestions = a.filter((q) => q.sectionCode === '1.7.1');
const expected: Record<string, string> = {
  'MC1-0346': 'PSE QRQ', 'MC1-0348': 'PSE QRS', 'MC1-0351': 'QRU?', 'MC1-0352': 'QRU',
  'MC1-0353': 'QRV IN WAPC?', 'MC1-0357': 'QSA', 'MC1-0361': 'QSD AT Y',
  'MC1-0362': 'QSD PSE CK', 'MC1-0370': 'QSX FT8 ON 7074 KHZ',
};
const expectedCw: Record<string, string> = {
  'MC1-0376': 'AGN', 'MC1-0377': '另一个', 'MC1-0378': 'ARDF',
};
const expectedAbbreviationCodes: Array<[string, string]> = [
  ['MC1-0374','73'], ['MC1-0375','ADR / ADDR'], ['MC1-0376','AGN'], ['MC1-0377','AHR'], ['MC1-0378','ARDF'],
  ['MC1-0379','BOX / P O BOX'], ['MC1-0380','BURO'], ['MC1-0381','CK'], ['MC1-0382','CQ'], ['MC1-0383','DX'],
  ['MC1-0384','ES'], ['MC1-0385','FB'], ['MC1-0386','FER'], ['MC1-0387','FREQ'], ['MC1-0388','GA'],
  ['MC1-0389','GE'], ['MC1-0390','GL'], ['MC1-0391','GLD'], ['MC1-0392','GM'], ['MC1-0393','GMT'],
  ['MC1-0394','GN'], ['MC1-0395','GND'], ['MC1-0396','HNY'], ['MC1-0397','HPE'], ['MC1-0398','HPY / HPI'],
  ['MC1-0399','HST'], ['MC1-0400','K'], ['MC1-0401','KN'], ['MC1-0402','MNY TNX / MNI TNX'], ['MC1-0403','NW'],
  ['MC1-0404','OM'], ['MC1-0405','OP'], ['MC1-0406','PSE / PLS'], ['MC1-0407','R'], ['MC1-0408','SAE'],
  ['MC1-0409','SASE'], ['MC1-0410','SRI'], ['MC1-0411','TEMP'], ['MC1-0412','TNX / TKS'], ['MC1-0413','TU'],
  ['MC1-0414','UR'], ['MC1-0415','WL'], ['MC1-0416','XYL'], ['MC1-0417','YL'], ['MC1-0418','EL / ELE / ELS'],
  ['MC1-0419','DP'], ['MC1-0420','GP'], ['MC1-0421','VER'], ['MC1-0422','LW'], ['MC1-0423','YAGI'], ['MC1-0424','BEAM'],
];
if (qCodesData.length !== 21 || new Set(qCodesData.map((q) => q.code)).size !== 21) throw new Error('Q-code set must contain 21 unique entries');
for (const code of ['QTH','QSL','QSO','QRM','QRN','QRP','QRO','QRT','QRZ','QSY','QSB','QRV','QRL','QSP','QRQ','QRS','QRU','QSA','QSD','QSK','QSX']) if (!qCodesData.some((q) => q.code === code)) throw new Error(`missing Q-code ${code}`);
if (phrases.length !== 31 || cw.length !== 51) throw new Error(`A section counts: 2.4.1=${phrases.length}, 2.4.2=${cw.length}`);
if (communicationAbbreviations.length !== 51 || new Set(communicationAbbreviations.map((item) => item.questionId)).size !== 51) throw new Error('51 communication abbreviations must bind unique 2.4.2 question IDs');
for (const [id, code] of expectedAbbreviationCodes) if (!communicationAbbreviations.some((item) => item.questionId === id && item.code === code)) throw new Error(`${id}: missing or incorrect abbreviation ${code}`);
if (communicationAbbreviations.some((item) => {
  const question = cw.find((candidate) => candidate.id === item.questionId);
  const answer = question?.answerType.split('').map((key) => question.options.find((option) => option.key === key)?.text || '').filter(Boolean).join('；') || '';
  return !question || !item.code || !item.chinese || !item.description || !item.example || !item.category || normalize(item.sourceAnswer) !== normalize(answer);
})) throw new Error('communication abbreviation has incomplete or incorrect R2 source binding');
for (const code of ['WL','XYL','EL','ELE','ELS','DP','GP','VER','YAGI','BEAM']) if (!communicationAbbreviations.some((item) => item.code === code || item.aliases.some((alias) => alias === code))) throw new Error(`missing communication abbreviation ${code}`);
for (const [id, meaning] of [['MC1-0415','将要'],['MC1-0416','妻子'],['MC1-0418','天线单元'],['MC1-0420','垂直接地天线']] as const) if (!communicationAbbreviations.some((item) => item.questionId === id && item.chinese.includes(meaning))) throw new Error(`${id}: incorrect Chinese meaning, expected ${meaning}`);
const termCategories = new Set(hamTerms.map((item) => item.category));
if (hamTerms.length < 190 || new Set(hamTerms.map((item) => item.term.toLowerCase())).size !== hamTerms.length || termCategories.size !== 8 || hamTerms.some((item) => !item.term || !item.english || !item.category || !item.definition || !item.use || item.term.includes('实用要点'))) throw new Error('HAM term dictionary is incomplete, duplicated, or contains placeholders');
for (const code of ['HF','VHF','UHF','SSB','FT8','PTT','SWR','BALUN','VNA','APRS','CTCSS','EMC']) if (!hamTerms.some((item) => `${item.term} ${item.english} ${item.aliases.join(' ')}`.toUpperCase().includes(code))) throw new Error(`missing HAM term ${code}`);
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
const mappedProvinceNames = new Set(examCallsignDistricts.flatMap((district) => district.provinces));
if (CHINA_MAP_REGIONS.length !== 34 || new Set(CHINA_MAP_REGIONS.map((region) => region.adcode)).size !== 34) throw new Error('projected China map must contain 34 unique province-level regions');
for (const name of mappedProvinceNames) if (!CHINA_MAP_REGIONS.some((region) => region.name === name && region.paths.length > 0)) throw new Error(`missing projected province geometry: ${name}`);
for (const name of ['台湾省', '香港特别行政区', '澳门特别行政区']) if (!CHINA_MAP_REGIONS.some((region) => region.name === name && region.paths.length > 0)) throw new Error(`missing special-prefix region geometry: ${name}`);
if (!CHINA_MAP_REGIONS.some((region) => region.name === '海南省' && region.insetPaths.length > 0) || SOUTH_CHINA_SEA_PATHS.length === 0) throw new Error('South China Sea inset geometry is incomplete');
if (frequencyAllocationQuestions.length !== 33) throw new Error(`A section 1.7.1 must contain 33 questions, got ${frequencyAllocationQuestions.length}`);
const expectedAllocationQuestionIds = Array.from({ length: 33 }, (_, index) => `MC1-${String(174 + index).padStart(4, '0')}`);
if (expectedAllocationQuestionIds.some((id) => !frequencyAllocationQuestions.some((question) => question.id === id))) throw new Error('A section 1.7.1 question sequence MC1-0174 through MC1-0206 is incomplete');
if (frequencyAllocations.length !== 18 || new Set(frequencyAllocations.map((item) => item.id)).size !== 18 || new Set(frequencyAllocations.map((item) => item.range)).size !== 18) throw new Error('frequency allocation table must contain 18 unique rows');
if (frequencyAllocations.some((item) => !Number.isFinite(item.startMHz) || !Number.isFinite(item.endMHz) || item.startMHz >= item.endMHz || !item.satellite || !item.relation || !item.examPoint || item.questions.length === 0)) throw new Error('frequency allocation row is incomplete or has an invalid normalized range');
const allocationById = new Map(frequencyAllocations.map((item) => [item.id, item]));
const expectedAllocationRows: Array<[string, string, string, number, number]> = [
  ['135k', 'LF', '次要', 0.1357, 0.1378],
  ['1m8', 'MF', '共同主要', 1.8, 2],
  ['5m3515', 'HF', '次要', 5.3515, 5.3665],
  ['7m', 'HF', '专用', 7, 7.2],
  ['14a', 'HF', '专用', 14, 14.25],
  ['14b', 'HF', '共同主要', 14.25, 14.35],
  ['144a', 'VHF', '唯一主要', 144, 146],
  ['144b', 'VHF', '共同主要', 146, 148],
  ['430m', 'UHF', '次要', 430, 440],
  ['47g', 'EHF', '专用', 47000, 47200],
  ['248g', 'EHF', '唯一主要', 248000, 250000],
];
for (const [id, spectrum, status, startMHz, endMHz] of expectedAllocationRows) {
  const item = allocationById.get(id);
  if (!item || item.spectrum !== spectrum || item.status !== status || item.startMHz !== startMHz || item.endMHz !== endMHz) throw new Error(`incorrect frequency allocation row ${id}`);
}
for (const [id, expectedRange] of [['warc', '10.1–10.15 / 18.068–18.168 / 24.89–24.99'], ['beacons', '14.100 / 18.110 / 21.150 / 24.930 / 28.200'], ['lsb7', '7.030–7.200'], ['usb21', '21.125–21.450'], ['fm29', '29.510–29.700'], ['avoid144', '144–144.035 / 145.8–146'], ['avoid430', '431.9–432.240 / 435–438']] as const) {
  const item = frequencyUseWindows.find((window) => window.id === id);
  if (!item || !item.range.includes(expectedRange)) throw new Error(`missing or incorrect frequency-use window ${id}`);
}
if (!frequencyUseWindows.find((item) => item.id === 'usb21')?.detail.includes('21.1495–21.1505')) throw new Error('21 MHz USB window must exclude the beacon protection range');
const allocationReferences = [
  ...allocationRules.map((item) => item.question),
  ...frequencyAllocations.flatMap((item) => item.questions),
  ...frequencyUseWindows.map((item) => item.question),
];
for (const reference of allocationReferences) {
  const question = frequencyAllocationQuestions.find((item) => item.id === reference.id);
  if (!question || question.jCode !== reference.jCode) throw new Error(`invalid 1.7.1 question binding ${reference.id}/${reference.jCode}`);
}
const coveredAllocationQuestionIds = new Set(allocationReferences.map((item) => item.id));
if (expectedAllocationQuestionIds.some((id) => !coveredAllocationQuestionIds.has(id))) throw new Error('frequency allocation table and rules do not cover all 33 section 1.7.1 questions');
console.log(`HAM tools: OK — ${qCodesData.length} Q-codes, ${communicationAbbreviations.length} R2 abbreviations, ${hamTerms.length} HAM terms, 31 phrases / 51 CW questions, 33 frequency-allocation questions / 18 rows, 10 zones / 31 provinces, 34 projected map regions`);
