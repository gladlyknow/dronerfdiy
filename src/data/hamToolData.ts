import { getBank } from './bankData';
export const coreCommunicationCount = 24;
export const r2QuestionPhrases = getBank('A').filter((q) => q.sectionCode === '2.4.1');
export const r2CwAbbreviations = getBank('A').filter((q) => q.sectionCode === '2.4.2');
export const answerText = (question: typeof r2QuestionPhrases[number]) => question.answerType.split('').map((key) => question.options.find((option) => option.key === key)?.text).filter(Boolean).join('；');
