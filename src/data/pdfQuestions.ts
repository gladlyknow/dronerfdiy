import { gunzipSync, strFromU8 } from 'fflate';
import type { PdfQuestion, QuestionOption } from '../types';
import chunk0 from './a-bank/chunk0';
import chunk1 from './a-bank/chunk1';
import chunk2 from './a-bank/chunk2';
import chunk3 from './a-bank/chunk3';
import chunk4a from './a-bank/chunk4a';
import chunk4b from './a-bank/chunk4b';
import chunk4c from './a-bank/chunk4c';
import chunk5 from './a-bank/chunk5';
import { A_EXPECTED_QUESTION_COUNT, A_EXPECTED_SECTION_COUNT, A_MODULE_CATALOG } from './aSectionCatalog';

type PackedQuestion = [
  id: string,
  jCode: string,
  sectionCode: string,
  question: string,
  answerType: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
];

const decodeBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const packedBase64 = `${chunk0}${chunk1}${chunk2}${chunk3}${chunk4a}${chunk4b}${chunk4c}${chunk5}`;
const packedRows = JSON.parse(strFromU8(gunzipSync(decodeBase64(packedBase64)))) as PackedQuestion[];

const keys = ['A', 'B', 'C', 'D'] as const;

const categoryForSection = (sectionCode: string): PdfQuestion['category'] => {
  if (sectionCode.startsWith('1.')) return 'law';
  if (sectionCode.startsWith('2.')) return 'comm';
  if (sectionCode.startsWith('5.')) return 'safety';
  return 'tech';
};

export const pdfQuestionsData: PdfQuestion[] = packedRows.map((row) => {
  const [id, jCode, sectionCode, question, answerType, ...optionTexts] = row;
  const options: QuestionOption[] = keys.map((key, index) => ({ key, text: optionTexts[index] }));
  return {
    id,
    jCode,
    sectionCode,
    question,
    answerType,
    options,
    explanation: '',
    level: 'A',
    category: categoryForSection(sectionCode),
    nodeId: `P-${sectionCode}`,
  };
});

const uniqueIds = new Set(pdfQuestionsData.map((q) => q.id));
const uniqueSections = new Set(pdfQuestionsData.map((q) => q.sectionCode).filter(Boolean));
const moduleTotal = A_MODULE_CATALOG.reduce((sum, module) => sum + module.count, 0);

export const A_BANK_INTEGRITY = {
  expectedQuestions: A_EXPECTED_QUESTION_COUNT,
  actualQuestions: pdfQuestionsData.length,
  uniqueQuestionIds: uniqueIds.size,
  expectedSections: A_EXPECTED_SECTION_COUNT,
  actualSections: uniqueSections.size,
  moduleTotal,
  isComplete:
    pdfQuestionsData.length === A_EXPECTED_QUESTION_COUNT &&
    uniqueIds.size === A_EXPECTED_QUESTION_COUNT &&
    uniqueSections.size === A_EXPECTED_SECTION_COUNT &&
    moduleTotal === A_EXPECTED_QUESTION_COUNT,
};

export const A_QUESTION_BANK_COUNT = pdfQuestionsData.length;
