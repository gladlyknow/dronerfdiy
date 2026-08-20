import { ExamLevel, ExamQuestion, KnowledgeNode } from '../types';
import { pdfQuestionsData } from './pdfQuestions';
import { hamKnowledgeTree } from './hamData';

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

export const EXAM_LEVEL_CONFIGS: Record<'A' | 'B' | 'C', LevelConfig> = {
  A: {
    level: 'A',
    title: 'A 类业余无线电台操作技术能力',
    subtitle: '入门级 · 30~3000MHz 特高频/超高频 · ≤25W',
    badge: 'A 类基础执照',
    color: 'emerald',
    totalQuestions: 30,
    passScore: 25,
    timeLimitMin: 40,
    allowedBands: '30 MHz ~ 3000 MHz (VHF 6m/2m, UHF 70cm 等)',
    maxPower: '不大于 25 瓦 (≤ 25 W)',
    examRequirements: '年满具备完全民事行为能力或监护人同意，不设设台年限门槛，免考试费',
    description: '业余无线电爱好者的起点。主要掌握基础法律法规、电台执照办理、V/U段手台车台操作、业余中继台规范使用、基本通联礼仪与人身电气安全。',
    syllabus: [
      { title: '无线电管理法律法规', desc: '《无线电管理条例》、2024《业余无线电台管理办法》、执照有效期与延续', count: '10 题' },
      { title: '通信方法与通联礼仪', desc: '呼号结构与分区、Q简语速查、字母解释法、中继台守听与礼让', count: '8 题' },
      { title: '射频与电学基础', desc: '波长频率换算、欧姆定律、天线极化、驻波比SWR概念、50Ω匹配', count: '7 题' },
      { title: '安全防护与防雷接地', desc: '安全特低电压、天线架设防高压线触电、防雷接地规范、射频辐射防护', count: '5 题' },
    ],
  },
  B: {
    level: 'B',
    title: 'B 类业余无线电台操作技术能力',
    subtitle: '进阶级 · 短波 HF 全段 (160m~10m) + UV · ≤100W',
    badge: 'B 类短波进阶',
    color: 'sky',
    totalQuestions: 50,
    passScore: 40,
    timeLimitMin: 60,
    allowedBands: '短波 HF 全段 (160m~10m) 及全部 VHF / UHF 频段',
    maxPower: '短波 ≤ 100 瓦 (≤ 100 W)；超短波 ≤ 25 瓦',
    examRequirements: '取得业余无线电台执照满 6 个月以上，且具有实际操作经验',
    description: '进阶短波远距离通联 (DX) 与全球跨洋通联的核心级别。深入考察短波电离层反射传播规律、太阳黑子周期、天线调谐系统与巴伦匹配、超外差镜像抑制计算、功率放大器分类等。',
    syllabus: [
      { title: '短波电波传播与电离层', desc: 'D/E/F1/F2层昼夜特性、最高可用频率MUF与静区、太阳黑子11年周期', count: '15 题' },
      { title: '收发信机与电路原理', desc: '超外差中频/镜像频率计算、动态范围与三阶互调、甲/乙/丙/丁类功放', count: '15 题' },
      { title: '天馈系统与射频调谐', desc: '半波偶极/八木/端馈天线、速度因子、加感线圈与效率、SWR与损耗', count: '12 题' },
      { title: '国际通联礼仪与DX规则', desc: 'IARU 分区与 DX 远征规范、Split 异频通联、QSL 卡片与竞赛守则', count: '8 题' },
    ],
  },
  C: {
    level: 'C',
    title: 'C 类业余无线电台操作技术能力',
    subtitle: '高级专家级 · 国际业余/卫星业务全段 · ≤1000W',
    badge: 'C 类千瓦专家',
    color: 'amber',
    totalQuestions: 80,
    passScore: 60,
    timeLimitMin: 90,
    allowedBands: '全部业余业务和卫星业余业务分配频段',
    maxPower: '短波 ≤ 1000 瓦 (≤ 1 kW)；超短波 ≤ 400 瓦',
    examRequirements: '取得载明 30MHz 以下短波频段业余无线电台执照满 18 个月以上',
    description: '业余无线电的最高技术殿堂。掌握大功率线性放大器设计、电磁兼容 (EMC) 与二次三次谐波深度抑制、地球-月球-地球 (EME) 月面反射通信、复杂天线阵列相位馈电与深空微弱信号处理。',
    syllabus: [
      { title: '大功率射频系统与EMC', desc: '千瓦级电子管/固态功放、低通滤波器阶数、杂散辐射抑制 >60dBc、互调产物', count: '25 题' },
      { title: '空间与微波极限通信', desc: '业余卫星多普勒频移校正、EME 月面反射、流星余迹通信、对流层散射', count: '20 题' },
      { title: '高阶天馈理论与相控阵', desc: '天线增益dBi/dBd转换、相控阵波束成形、对地镜像损耗与史密斯圆图', count: '20 题' },
      { title: '大功率安全与滚球法防雷', desc: '强射频场生物防护限值、60米滚球法避雷针保护角、大电流汇流铜带', count: '15 题' },
    ],
  },
};

// Map questions cleanly to their specific exam tiers
export function getQuestionsByLevel(level: ExamLevel): ExamQuestion[] {
  if (level === 'ALL') return pdfQuestionsData;
  // A includes foundational questions
  if (level === 'A') {
    return pdfQuestionsData.filter((q) => {
      // Basic law, V/U frequencies, phonetic, basic electronics
      const isA_topic = 
        q.sectionCode?.startsWith('1.1') || 
        q.sectionCode?.startsWith('1.2') || 
        q.sectionCode?.startsWith('1.3') || 
        q.sectionCode?.startsWith('2.1') || 
        q.sectionCode?.startsWith('2.2') || 
        q.sectionCode?.startsWith('3.1') || 
        q.sectionCode?.startsWith('4.1');
      return isA_topic || q.level === 'A';
    });
  }
  if (level === 'B') {
    return pdfQuestionsData.filter((q) => {
      // HF bands, ionosphere, superhet, SWR, intermediate tech
      const isB_topic = 
        q.sectionCode?.startsWith('1.3') ||
        q.sectionCode?.startsWith('1.4') || 
        q.sectionCode?.startsWith('2.2') || 
        q.sectionCode?.startsWith('2.3') || 
        q.sectionCode?.startsWith('3.2') || 
        q.sectionCode?.startsWith('3.3') || 
        q.sectionCode?.startsWith('4.2');
      return isB_topic || q.level === 'B';
    });
  }
  if (level === 'C') {
    return pdfQuestionsData.filter((q) => {
      // 1000W, space/satellite, EME, advanced EMC, smith chart
      const isC_topic = 
        q.sectionCode?.startsWith('1.3') ||
        q.sectionCode?.startsWith('2.4') || 
        q.sectionCode?.startsWith('3.4') || 
        q.sectionCode?.startsWith('3.5') || 
        q.sectionCode?.startsWith('4.3');
      return isC_topic || q.level === 'C';
    });
  }
  return pdfQuestionsData;
}

// Generate random mock exam set strictly according to official syllabus rules
export function generateMockExam(level: 'A' | 'B' | 'C'): ExamQuestion[] {
  const config = EXAM_LEVEL_CONFIGS[level];
  const pool = getQuestionsByLevel(level);
  
  // Shuffle array
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, config.totalQuestions);

  // If pool is smaller than required, wrap around to ensure full count
  if (selected.length < config.totalQuestions) {
    let index = 0;
    while (selected.length < config.totalQuestions && pool.length > 0) {
      selected.push({ ...pool[index % pool.length], id: `${pool[index % pool.length].id}-dup-${selected.length}` });
      index++;
    }
  }

  return selected;
}
