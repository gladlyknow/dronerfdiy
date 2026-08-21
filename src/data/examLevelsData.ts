import type { ExamLevel, ExamQuestion } from '../types';
import { getBank, getBankStats, getModuleCatalog } from './bankData';

export interface LevelConfig {
  level: ExamLevel;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  totalQuestions: number;
  singleQuestions: number;
  multipleQuestions: number;
  passScore: number;
  timeLimitMin: number;
  allowedBands: string;
  maxPower: string;
  examRequirements: string;
  description: string;
  syllabus: { title: string; desc: string; count: string }[];
  sourceStatus: 'complete' | 'missing';
}

const syllabusFor = (level: 'A' | 'B' | 'C') =>
  getModuleCatalog(level).map((module) => ({
    title: module.title,
    desc: `${module.sections.length} 个原始 [P] 小节；可逐节反查全部源题。`,
    count: `${module.count} 题`,
  }));

const sourceSubtitle = (level: 'A' | 'B' | 'C') => {
  const stats = getBankStats(level);
  return `R2 原始题库完整导入 · ${stats.count}/${stats.count} 题 · ${stats.sections} 小节`;
};

export const EXAM_LEVEL_CONFIGS: Record<'A' | 'B' | 'C', LevelConfig> = {
  A: {
    level: 'A',
    title: 'A 类业余无线电台操作技术能力',
    subtitle: sourceSubtitle('A'),
    badge: 'A 类操作技术能力',
    color: 'emerald',
    totalQuestions: 40,
    singleQuestions: 32,
    multipleQuestions: 8,
    passScore: 30,
    timeLimitMin: 40,
    allowedBands: '30 MHz ～ 3000 MHz（仍须符合频率划分及电台执照）',
    maxPower: '最大发射功率不大于 25 W（≤25 W）',
    examRequirements: 'A 类验证；题目数据以 R2 A类题库.pdf 为唯一原始数据源。',
    description: '当前 A 类题库、答案、章节 [P] 与 J 码均从 R2 PDF 自动提取并通过完整性校验。',
    syllabus: syllabusFor('A'),
    sourceStatus: 'complete',
  },
  B: {
    level: 'B',
    title: 'B 类业余无线电台操作技术能力',
    subtitle: sourceSubtitle('B'),
    badge: 'B 类操作技术能力',
    color: 'sky',
    totalQuestions: 60,
    singleQuestions: 45,
    multipleQuestions: 15,
    passScore: 45,
    timeLimitMin: 60,
    allowedBands: '可申请 30 MHz 以下及 30 MHz 以上相应业余业务频段（以频率划分和执照为准）',
    maxPower: '30 MHz 以下 <15 W；30 MHz 以上 ≤25 W',
    examRequirements: '依法取得业余无线电台执照 6 个月以上并具有相应实际操作经验。',
    description: '当前 B 类全部题目直接来自 R2 B类题库.pdf，不复用 A 类题目，也不使用 AI 补题。',
    syllabus: syllabusFor('B'),
    sourceStatus: 'complete',
  },
  C: {
    level: 'C',
    title: 'C 类业余无线电台操作技术能力',
    subtitle: sourceSubtitle('C'),
    badge: 'C 类操作技术能力',
    color: 'amber',
    totalQuestions: 90,
    singleQuestions: 70,
    multipleQuestions: 20,
    passScore: 70,
    timeLimitMin: 90,
    allowedBands: '可申请各业余业务和卫星业余业务频段（以频率划分和执照为准）',
    maxPower: '30 MHz 以下 ≤1000 W；30 MHz 以上一般 ≤25 W',
    examRequirements: '依法取得载明 30 MHz 以下频段的业余无线电台执照 18 个月以上并具有相应实际操作经验。',
    description: '当前 C 类全部题目直接来自 R2 C类题库.pdf，不复用 A/B 类题目，也不使用 AI 补题。',
    syllabus: syllabusFor('C'),
    sourceStatus: 'complete',
  },
};

export function getQuestionsByLevel(level: ExamLevel): ExamQuestion[] {
  if (level === 'ALL') return [...getBank('A'), ...getBank('B'), ...getBank('C')];
  return getBank(level);
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
  const config = EXAM_LEVEL_CONFIGS[level];
  const pool = getBank(level);
  const singles = shuffle(pool.filter((q) => (q.answerType || '').length === 1));
  const multiples = shuffle(pool.filter((q) => (q.answerType || '').length > 1));
  const selected = [
    ...singles.slice(0, config.singleQuestions),
    ...multiples.slice(0, config.multipleQuestions),
  ];
  if (selected.length !== config.totalQuestions) {
    throw new Error(`${level} 类题库不足以按考核标准生成试卷：需要 ${config.singleQuestions} 单选 + ${config.multipleQuestions} 多选`);
  }
  return shuffle(selected);
}
