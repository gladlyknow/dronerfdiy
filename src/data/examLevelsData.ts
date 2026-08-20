import type { ExamLevel, ExamQuestion } from '../types';
import { pdfQuestionsData } from './pdfQuestions';

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
}

const NOT_OPEN = '当前 /redio/ 页面仅维护 A 类题库，B/C 类内容暂未开放。';

export const EXAM_LEVEL_CONFIGS: Record<'A' | 'B' | 'C', LevelConfig> = {
  A: {
    level: 'A',
    title: 'A 类业余无线电台操作技术能力',
    subtitle: '入门级 · 30–3000 MHz · 最大发射功率 ≤25 W',
    badge: 'A 类操作技术能力',
    color: 'emerald',
    totalQuestions: 40,
    passScore: 30,
    timeLimitMin: 40,
    allowedBands: '30 MHz ～ 3000 MHz（以频率划分和电台执照核准为准）',
    maxPower: '不大于 25 W（≤25 W）',
    examRequirements: 'A 类操作技术能力验证；本页面按当前 A 类题库组织学习。',
    description: 'A 类考试围绕无线电管理法规、规范通联、VHF/UHF 基础技术、设备电路与安全应急展开。当前考试按 40 题组织：32 道单选题 + 8 道多选题，答对 30 题合格，考试时间 40 分钟。',
    syllabus: [
      { title: '法律法规与无线电管理', desc: '无线电管理条例、业余无线电台管理办法、设台许可、频率管理、A 类权限与违规边界', count: '核心模块' },
      { title: '通联规范与通联程序', desc: '呼号结构与 1～0 分区、CQ、RST、Q 简语、ITU 字母解释法、QSL 与日志', count: '核心模块' },
      { title: '无线电技术与电波传播', desc: '频率波长、调制与发射类别、VHF/UHF 传播、天线馈线与驻波', count: '核心模块' },
      { title: '设备操作与电路基础', desc: 'PTT/SQL/VOX/CTCSS、NB/ATT/AGC/ALC、调制解调、欧姆定律与电源测试', count: '核心模块' },
      { title: '安全防护与应急通信', desc: '安全电压、防雷接地、电气维修、电磁环境、突发事件应急通信规则', count: '核心模块' },
    ],
  },
  B: { level: 'B', title: 'B 类（暂未开放）', subtitle: NOT_OPEN, badge: '暂未开放', color: 'sky', totalQuestions: 0, passScore: 0, timeLimitMin: 0, allowedBands: NOT_OPEN, maxPower: NOT_OPEN, examRequirements: NOT_OPEN, description: NOT_OPEN, syllabus: [] },
  C: { level: 'C', title: 'C 类（暂未开放）', subtitle: NOT_OPEN, badge: '暂未开放', color: 'amber', totalQuestions: 0, passScore: 0, timeLimitMin: 0, allowedBands: NOT_OPEN, maxPower: NOT_OPEN, examRequirements: NOT_OPEN, description: NOT_OPEN, syllabus: [] },
};

export function getQuestionsByLevel(level: ExamLevel): ExamQuestion[] {
  if (level === 'ALL') return pdfQuestionsData;
  if (level !== 'A') return [];

  return pdfQuestionsData.filter((question) => {
    if (question.level === 'A') return true;
    const code = question.sectionCode || '';
    return (
      code.startsWith('1.1') || code.startsWith('1.2') || code.startsWith('1.3') ||
      code.startsWith('2.1') || code.startsWith('2.2') || code.startsWith('3.1') || code.startsWith('4.1')
    );
  });
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
  const pool = getQuestionsByLevel('A');
  const singles = shuffle(pool.filter((q) => (q.answerType || '').length <= 1));
  const multiples = shuffle(pool.filter((q) => (q.answerType || '').length > 1));

  // 当前 A 类考试结构：32 道单选 + 8 道多选。若 Google AI 项目内置样本不足，
  // 则用剩余题目补齐到不超过 40 题，并避免重复题目。
  const selected: ExamQuestion[] = [...singles.slice(0, 32), ...multiples.slice(0, 8)];
  const selectedIds = new Set(selected.map((q) => q.id));

  if (selected.length < 40) {
    for (const question of shuffle(pool)) {
      if (selected.length >= 40) break;
      if (!selectedIds.has(question.id)) {
        selected.push(question);
        selectedIds.add(question.id);
      }
    }
  }

  return shuffle(selected);
}
