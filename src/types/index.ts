export type DomainType = 'radio' | 'drone';
export type ExamLevel = 'A' | 'B' | 'C' | 'ALL';
export type CategoryType = 'law' | 'comm' | 'tech' | 'safety' | 'drone' | 'bands' | 'drone_laws' | 'drone_build';

export interface KnowledgeNode {
  id: string;
  title: string;
  domain: DomainType;
  category: 'law' | 'comm' | 'tech' | 'safety' | 'drone' | 'bands';
  level: number;
  examLevel?: ExamLevel;
  pdfPage?: number;
  targetQuestionId?: string;
  sectionCode?: string;
  summary: string;
  detail: string;
  mnemonic?: string;
  trapWarning?: string;
  keyFormula?: string;
  examTips?: string[];
  children?: KnowledgeNode[];
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExamQuestion {
  id: string;
  jCode?: string;
  sectionCode?: string;
  page?: number;
  question: string;
  options: (QuestionOption | string)[];
  answerType?: string;
  correctIndex?: number;
  trapType?: string;
  explanation: string;
  level?: ExamLevel;
  category?: 'law' | 'comm' | 'tech' | 'safety' | 'bands' | 'drone_laws' | 'drone_build';
  nodeId?: string;
}

export type PdfQuestion = ExamQuestion;

// Google AI 原工程还保留一组独立的演示 Quiz 数据，其结构与正式 ExamQuestion 不同。
export interface QuizQuestion {
  id: number;
  domain: DomainType;
  examLevel: ExamLevel;
  category: CategoryType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CallsignDistrict {
  zone: number;
  name: string;
  provinces: string[];
  description: string;
  mnemonic: string;
  badgeColor: string;
  specialRules?: string;
  notes?: string[];
}

export interface QCodeItem {
  code: string;
  question: string;
  answer: string;
  chinese: string;
  examImportance: 'critical' | 'high' | 'normal';
  mnemonic?: string;
  exampleQso?: string;
  category: 'traffic' | 'signal' | 'location' | 'freq' | 'equipment';
}

export interface PhoneticItem {
  letter: string;
  word: string;
  ipa: string;
  chinesePronunciation: string;
  morse: string;
  morseAudioPattern: string;
}

export interface BandPowerSpec {
  bandName: string;
  frequencyRange: string;
  wavelength: string;
  aClassAllowed: boolean;
  bClassAllowed: boolean;
  cClassAllowed: boolean;
  maxPowerA: string;
  maxPowerB: string;
  maxPowerC: string;
  serviceStatus: string;
  notes: string;
  examTrap?: string;
}

export interface DroneSubsystem {
  id: string;
  title: string;
  icon: string;
  summary: string;
  components: { name: string; description: string; specs: string[]; tips: string }[];
}

export interface DroneRegulationItem {
  id: string;
  category: 'uom' | 'airspace' | 'license' | 'penalty';
  title: string;
  rule: string;
  detail: string;
  complianceLevel: 'mandatory' | 'warning' | 'info';
}

export interface BetaflightPidGuide {
  param: 'P' | 'I' | 'D' | 'FeedForward';
  fullName: string;
  role: string;
  tooLowSymptom: string;
  tooHighSymptom: string;
  tuningAdvice: string;
}

export interface DiyProjectStep { title: string; desc: string; tips?: string }

export interface DiyProjectItem {
  id: string;
  title: string;
  domain: DomainType;
  difficulty: '入门' | '进阶' | '专家';
  summary: string;
  materials: string[];
  tools: string[];
  steps: DiyProjectStep[];
  formula?: string;
  caution?: string;
  tags: string[];
}

export interface GearRecommendation {
  id: string;
  domain: DomainType;
  category: string;
  brand: string;
  name: string;
  priceRange: string;
  targetUser: string;
  keySpecs: Record<string, string>;
  pros: string[];
  cons: string[];
  bestFor: string;
}
