import type { ExamQuestion } from '../types';
import A from './generated/A';
import B from './generated/B';
import C from './generated/C';
import ACatalog from './generated/ACatalog';
import BCatalog from './generated/BCatalog';
import CCatalog from './generated/CCatalog';
import manifest from './generated/manifest';

export type ConcreteExamLevel = 'A' | 'B' | 'C';

export const QUESTION_BANKS: Record<ConcreteExamLevel, ExamQuestion[]> = {
  A: [...A],
  B: [...B],
  C: [...C],
};

export const SECTION_CATALOGS = {
  A: ACatalog,
  B: BCatalog,
  C: CCatalog,
};

export const BANK_MANIFEST = manifest;

export const MODULE_TITLES: Record<string, string> = {
  '1': '法律法规与无线电管理',
  '2': '通联规范与通联程序',
  '3': '无线电技术与电波传播',
  '4': '设备操作与电路基础',
  '5': '安全防护与应急通信',
};

export function getBank(level: ConcreteExamLevel): ExamQuestion[] {
  return QUESTION_BANKS[level];
}

export function getBankStats(level: ConcreteExamLevel) {
  return BANK_MANIFEST.banks[level];
}

export function getSectionCatalog(level: ConcreteExamLevel) {
  return SECTION_CATALOGS[level];
}

export function getModuleCatalog(level: ConcreteExamLevel) {
  const sections = getSectionCatalog(level);
  const grouped = new Map<string, typeof sections>();
  for (const section of sections) {
    const list = grouped.get(section.moduleId) || [];
    list.push(section);
    grouped.set(section.moduleId, list);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
    .map(([code, moduleSections]) => ({
      code,
      title: MODULE_TITLES[code] || `模块 ${code}`,
      count: moduleSections.reduce((sum, item) => sum + item.count, 0),
      sections: moduleSections,
    }));
}

export function getBankIntegrity(level: ConcreteExamLevel) {
  const stats = getBankStats(level);
  const actual = getBank(level);
  const sectionTotal = Object.values(stats.sectionCounts).reduce((sum, count) => sum + count, 0);
  const isComplete =
    actual.length === stats.count &&
    stats.uniqueIds === stats.count &&
    stats.missingFields === 0 &&
    sectionTotal === stats.count;

  return {
    ...stats,
    actualQuestions: actual.length,
    sectionTotal,
    isComplete,
  };
}

export const ALL_BANK_INTEGRITY = {
  A: getBankIntegrity('A'),
  B: getBankIntegrity('B'),
  C: getBankIntegrity('C'),
};
