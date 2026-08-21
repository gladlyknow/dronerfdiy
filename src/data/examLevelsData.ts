import type { ExamLevel, ExamQuestion } from '../types';
import { pdfQuestionsData } from './pdfQuestions';
import { A_MODULE_CATALOG } from './aSectionCatalog';

export interface LevelConfig {
  level: ExamLevel;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  totalQuestions: number;
  passScore: number;
  timeLimitMin: number;
  allowedBands: string;
  maxPower: string;
  examRequirements: string;
  description: string;
  syllabus: { title: string; desc: string; count: string }[];
  sourceStatus: 'complete' | 'missing';
}

const waitingForSource = (level: 'B' | 'C') =>
  `已建立 ${level} 类独立学习入口，但当前会话只提供了 A 类原始题库。为保证题库不被模型补写或混用，${level} 类题目将在导入对应原始题库后启用。`;

export const EXAM_LEVEL_CONFIGS: Record<'A' | 'B' | 'C', LevelConfig> = {
  A: {
    level: 'A',
    title: 'A 类业余无线电台操作技术能力',
    subtitle: '当前原始题库已完整导入 · 683 / 683',
    badge: 'A 类操作技术能力',
    color: 'emerald',
    totalQuestions: 40,
    passScore: 30,
    timeLimitMin: 40,
    allowedBands: '30 MHz ～ 3000 MHz（以当前题库表述为准）',
    maxPower: '不大于 25 W（≤25 W）',
    examRequirements: '以当前 A 类原始题库为唯一题目数据源。',
    description: '全部题目由当前 A 类题库的 [I]、[J]、[P]、[Q]、[T]、[A-D] 字段直接生成；不再使用 Google AI 示例摘录。',
    syllabus: A_MODULE_CATALOG.map((module) => ({
      title: module.title,
      desc: `${module.sections.length} 个原始 [P] 小节，所有题目均可反查到原题。`,
      count: `${module.count} 题`,
    })),
    sourceStatus: 'complete',
  },
  B: {
    level: 'B',
    title: 'B 类业余无线电台操作技术能力',
    subtitle: '独立学习入口 · 原始题库待导入',
    badge: 'B 类操作技术能力',
    color: 'sky',
    totalQuestions: 0,
    passScore: 0,
    timeLimitMin: 0,
    allowedBands: '等待 B 类原始题库后从源数据生成',
    maxPower: '等待 B 类原始题库后从源数据生成',
    examRequirements: waitingForSource('B'),
    description: waitingForSource('B'),
    syllabus: [],
    sourceStatus: 'missing',
  },
  C: {
    level: 'C',
    title: 'C 类业余无线电台操作技术能力',
    subtitle: '独立学习入口 · 原始题库待导入',
    badge: 'C 类操作技术能力',
    color: 'amber',
    totalQuestions: 0,
    passScore: 0,
    timeLimitMin: 0,
    allowedBands: '等待 C 类原始题库后从源数据生成',
    maxPower: '等待 C 类原始题库后从源数据生成',
    examRequirements: waitingForSource('C'),
    description: waitingForSource('C'),
    syllabus: [],
    sourceStatus: 'missing',
  },
};

export function getQuestionsByLevel(level: ExamLevel): ExamQuestion[] {
  if (level === 'ALL' || level === 'A') return pdfQuestionsData;
  return [];
}

const shuffle = <T,>(input: T[]): T[] => {
  const output = [...input];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};

export function generateMockExam(level: 'A' | 'B' | 'C'): ExamQuestion[] {
  if (level !== 'A') return [];
  const pool = pdfQuestionsData;
  const singles = shuffle(pool.filter((q) => (q.answerType || '').length === 1));
  const multiples = shuffle(pool.filter((q) => (q.answerType || '').length > 1));
  return shuffle([...singles.slice(0, 32), ...multiples.slice(0, 8)]);
}
