import { A_BANK_INTEGRITY, pdfQuestionsData } from '../src/data/pdfQuestions';
import { A_SECTION_CATALOG } from '../src/data/aSectionCatalog';

const errors: string[] = [];

if (!A_BANK_INTEGRITY.isComplete) {
  errors.push(`global integrity failed: ${JSON.stringify(A_BANK_INTEGRITY)}`);
}

for (const section of A_SECTION_CATALOG) {
  const actual = pdfQuestionsData.filter((question) => question.sectionCode === section.code).length;
  if (actual !== section.count) {
    errors.push(`[P]${section.code}: expected ${section.count}, actual ${actual}`);
  }
}

const missingFields = pdfQuestionsData.filter((question) =>
  !question.id ||
  !question.jCode ||
  !question.sectionCode ||
  !question.question ||
  !question.answerType ||
  question.options.length !== 4 ||
  question.options.some((option) => !option.key || !option.text)
);

if (missingFields.length > 0) {
  errors.push(`questions with missing source fields: ${missingFields.map((q) => q.id).join(', ')}`);
}

const singles = pdfQuestionsData.filter((q) => (q.answerType || '').length === 1).length;
const multiples = pdfQuestionsData.filter((q) => (q.answerType || '').length > 1).length;

console.log(JSON.stringify({
  questions: pdfQuestionsData.length,
  uniqueIds: A_BANK_INTEGRITY.uniqueQuestionIds,
  sections: A_BANK_INTEGRITY.actualSections,
  moduleTotal: A_BANK_INTEGRITY.moduleTotal,
  singles,
  multiples,
  missingFields: missingFields.length,
  sectionCountChecks: A_SECTION_CATALOG.length,
}, null, 2));

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('A bank verification passed: 683/683 questions, 51/51 sections.');
