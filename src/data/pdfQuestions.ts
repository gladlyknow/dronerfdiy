import type { PdfQuestion } from '../types';
import { getBank, getBankIntegrity } from './bankData';

// Backward-compatible A-class exports for components that still import this module.
// The authoritative source is now src/data/generated/A.ts, produced directly from R2 A类题库.pdf.
export const pdfQuestionsData: PdfQuestion[] = getBank('A');

const integrity = getBankIntegrity('A');
export const A_BANK_INTEGRITY = {
  expectedQuestions: integrity.count,
  actualQuestions: integrity.actualQuestions,
  uniqueQuestionIds: integrity.uniqueIds,
  expectedSections: integrity.sections,
  actualSections: integrity.sections,
  moduleTotal: integrity.sectionTotal,
  isComplete: integrity.isComplete,
};

export const A_QUESTION_BANK_COUNT = pdfQuestionsData.length;
