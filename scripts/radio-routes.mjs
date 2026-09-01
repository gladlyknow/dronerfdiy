// @ts-check

/** @typedef {'zh-CN' | 'en-CN' | 'en-US' | 'zh-US'} RadioLocale */
/** @typedef {'CN' | 'US' | 'GLOBAL'} RadioMarket */
/** @typedef {'Article' | 'WebApplication'} StructuredDataType */
/** @typedef {{ label: string, url: string }} OfficialSource */
/** @typedef {{ question: string, answer: string }} Faq */
/** @typedef {{ heading: string, paragraphs?: string[], items?: string[] }} ContentSection */
/**
 * @typedef {object} RadioRoute
 * @property {string} path
 * @property {RadioLocale} locale
 * @property {RadioMarket} market
 * @property {string} title
 * @property {string} description
 * @property {string} canonical
 * @property {Record<RadioLocale, string>} alternates
 * @property {string} lastReviewed
 * @property {StructuredDataType} structuredDataType
 * @property {string} h1
 * @property {string} quickAnswer
 * @property {string[]} requirements
 * @property {string[]} steps
 * @property {ContentSection[]} sections
 * @property {string} cta
 * @property {string} ctaHref
 * @property {Faq[]} faq
 * @property {OfficialSource[]} officialSources
 */

export const SITE_ORIGIN = 'https://dronerfdiy.com';
export const SUPPORTED_LOCALES = /** @type {const} */ (['zh-CN', 'en-CN', 'en-US', 'zh-US']);
export const LOCALE_HUBS = /** @type {const} */ ({
  'zh-CN': '/radio/cn/zh/',
  'en-CN': '/radio/cn/en/',
  'en-US': '/radio/us/en/',
  'zh-US': '/radio/us/zh/',
});

const sources = {
  cracBank: {
    label: 'CRAC — 关于启用 2025 年版业余无线电台操作技术能力验证题库的通知',
    url: 'https://www.crac.org.cn/?p=1170',
  },
  miitRules: {
    label: '工业和信息化部 — 业余无线电台管理办法',
    url: 'https://wap.miit.gov.cn/jgsj/wgj/bmgz/art/2024/art_d042592aca6f4e3ca9cf51720f09bbc2.html',
  },
  arrlLicense: {
    label: 'ARRL — Getting Licensed Step by Step',
    url: 'https://www.arrl.org/getting-licensed-step-by-step',
  },
  ncvecTechnician: {
    label: 'NCVEC — 2026–2030 Technician Question Pool',
    url: 'https://ncvec.org/index.php/2026-2030-technician-question-pool',
  },
};

const allHubs = { ...LOCALE_HUBS };
const licenseAlternates = {
  'zh-CN': '/radio/cn/zh/license/',
  'en-CN': '/radio/cn/en/license/',
  'en-US': '/radio/us/en/ham-radio-license/',
  'zh-US': '/radio/us/zh/ham-radio-license/',
};

/** @param {Omit<RadioRoute, 'canonical' | 'alternates' | 'lastReviewed'> & { alternates?: Record<RadioLocale, string> }} input */
const defineRoute = (input) => ({
  canonical: input.path,
  alternates: input.alternates ?? allHubs,
  lastReviewed: '2026-09-01',
  ...input,
});

const cnFaq = [
  {
    question: '操作技术能力验证证书等于无线电台执照吗？',
    answer: '不等于。能力验证、设置使用电台与取得呼号涉及不同要求，行动前应分别核对工信部、CRAC 和属地主管部门的当前规定。',
  },
  {
    question: '本站题库能替代官方通知吗？',
    answer: '不能。本站用于学习和练习；题库版本、验证安排、设台和使用条件以官方现行信息为准。',
  },
];

const usFaq = [
  {
    question: 'Which US license class should a new learner start with?',
    answer: 'Technician is the entry-level class. Your long-term operating goals can then guide whether you continue to General and Amateur Extra.',
  },
  {
    question: 'Is Radio Earth an FCC or examination service?',
    answer: 'No. Radio Earth is a learning product. Confirm current licensing and examination requirements through official or recognized sources.',
  },
];

/** @type {readonly RadioRoute[]} */
export const radioRoutes = [
  defineRoute({
    path: '/radio/', locale: 'en-US', market: 'GLOBAL', structuredDataType: 'WebApplication',
    title: 'Radio Earth — Explore Invisible Signals Around Earth | DroneRF DIY',
    description: 'See, hear and understand radio signals through licensing, satellites, propagation, listening and practical tools.',
    h1: 'Radio Earth',
    quickAnswer: 'See, hear and understand the invisible radio signals around Earth. Start with a region-specific license path, then continue into satellites, propagation, listening and radio tools.',
    requirements: ['Choose China or the United States.', 'Choose Chinese or English independently from the region.', 'Treat every regulatory statement as versioned information.'],
    steps: ['Choose a regional learning path.', 'Build knowledge with guides and practice tools.', 'Continue exploring signals after the exam.'],
    sections: [
      { heading: 'Receive · Learn · Explore', items: ['License and exam learning', 'Satellite and space-weather context', 'Propagation and listening experiences'] },
      { heading: 'No radio transmission', paragraphs: ['Radio Earth V1 is designed for receiving, learning and exploration. It does not control or enable a transmitter.'] },
    ],
    cta: 'Choose a region and begin exploring.', ctaHref: '/radio/cn/zh/', faq: [], officialSources: [],
  }),

  defineRoute({
    path: '/radio/cn/zh/', locale: 'zh-CN', market: 'CN', structuredDataType: 'WebApplication',
    title: 'Radio Earth 中国站｜业余无线电学习、卫星与传播',
    description: '面向中国用户的业余无线电学习、A/B/C 类题库、卫星、传播与收听入口。',
    h1: '探索地球周围看不见的无线电信号',
    quickAnswer: '从中国业余无线电学习与 2025 年版 A/B/C 题库开始，再进入卫星、传播、收听和工具。',
    requirements: ['法规和题库信息以中国官方来源为准。', '能力验证与设置使用无线电台应分别理解。'],
    steps: ['进入中国 License 学习区。', '使用完整题库和模拟考试。', '继续探索卫星、传播与收听。'],
    sections: [{ heading: '现有学习资产', items: ['A 类 683 道源题', 'B 类 1143 道源题', 'C 类 1282 道源题', '错题本、知识图谱与 HAM 工具'] }],
    cta: '进入中国业余无线电 License 学习区', ctaHref: '/radio/cn/zh/license/', faq: cnFaq, officialSources: [sources.cracBank, sources.miitRules],
  }),
  defineRoute({
    path: '/radio/cn/en/', locale: 'en-CN', market: 'CN', structuredDataType: 'WebApplication',
    title: 'Radio Earth China — Amateur Radio Learning in English',
    description: 'An English-language entry point to China-specific amateur radio learning, source-bank practice and radio tools.',
    h1: 'Radio Earth China',
    quickAnswer: 'Use English-language navigation while keeping China as the regulatory market. China-specific rules and source versions are not replaced by US content.',
    requirements: ['Keep the market set to China for China-specific licensing content.', 'Confirm current requirements through Chinese official sources.'],
    steps: ['Open the China license guide.', 'Use verified source-bank practice.', 'Continue to shared radio tools.'],
    sections: [{ heading: 'Language is not jurisdiction', paragraphs: ['Changing the interface to English does not change the regulator, question bank or frequency rules that apply to the China market.'] }],
    cta: 'Open the China license guide', ctaHref: '/radio/cn/en/license/', faq: [], officialSources: [sources.cracBank, sources.miitRules],
  }),
  defineRoute({
    path: '/radio/us/en/', locale: 'en-US', market: 'US', structuredDataType: 'WebApplication',
    title: 'Radio Earth US — Ham Radio License and Signal Exploration',
    description: 'US ham radio licensing guides followed by satellites, propagation, listening and practical radio exploration.',
    h1: 'Explore radio in the United States',
    quickAnswer: 'Start with Technician, General or Amateur Extra licensing guidance, then use Radio Earth to explore what radio can actually do.',
    requirements: ['Use the current official question pool for the selected class.', 'Confirm examination and FCC processes through recognized sources.'],
    steps: ['Learn the license classes.', 'Prepare with current official material.', 'Continue into satellites, propagation and listening.'],
    sections: [{ heading: 'Three current license classes', items: ['Technician', 'General', 'Amateur Extra'] }],
    cta: 'Start the US ham radio license guide', ctaHref: '/radio/us/en/ham-radio-license/', faq: usFaq, officialSources: [sources.arrlLicense, sources.ncvecTechnician],
  }),
  defineRoute({
    path: '/radio/us/zh/', locale: 'zh-US', market: 'US', structuredDataType: 'WebApplication',
    title: 'Radio Earth 美国站｜中文 Ham Radio License 指南',
    description: '面向中文用户的美国 Technician、General、Amateur Extra 执照学习入口。',
    h1: '用中文了解美国业余无线电',
    quickAnswer: '界面使用中文，但监管地区保持美国；执照等级、题库与考试信息以 FCC、NCVEC 和 ARRL 当前资料为准。',
    requirements: ['区分语言设置与监管地区。', '使用当前有效的美国官方题库资料。'],
    steps: ['了解三种执照等级。', '选择目标等级。', '核对当前考试流程。'],
    sections: [{ heading: '美国执照等级', items: ['Technician：入门等级', 'General：进阶等级', 'Amateur Extra：最高等级'] }],
    cta: '进入中文美国执照指南', ctaHref: '/radio/us/zh/ham-radio-license/', faq: [], officialSources: [sources.arrlLicense, sources.ncvecTechnician],
  }),

  defineRoute({
    path: '/radio/cn/zh/license/', locale: 'zh-CN', market: 'CN', structuredDataType: 'Article', alternates: licenseAlternates,
    title: '中国业余无线电操作证怎么考？2025 新版 A/B/C 题库',
    description: '中国业余无线电 A/B/C 类学习路径、2025 年版完整题库、模拟考试及操作证与电台执照区别。',
    h1: '中国业余无线电操作证怎么考？',
    quickAnswer: '先确定 A、B 或 C 类学习目标，使用 2025 年版权威源题复习并参加相应能力验证；设置、使用业余无线电台仍需另行满足电台执照等要求。',
    requirements: ['确认目标类别及当前前置条件。', '使用自 2025 年 10 月 1 日启用的 2025 年版题库。', '分别核对能力验证、呼号与设台使用要求。'],
    steps: ['选择 A/B/C 类。', '按知识点学习并浏览完整源题。', '参加随机选项模拟考试。', '复盘错题。', '通过官方渠道核对报名及设台步骤。'],
    sections: [
      { heading: '三类学习入口', items: ['A 类：683 道源题', 'B 类：1143 道源题', 'C 类：1282 道源题'] },
      { heading: '操作证不等于电台执照', paragraphs: ['操作技术能力验证证明能力条件；设置、使用业余无线电台还需满足现行管理办法和属地要求。'] },
    ],
    cta: '打开 A/B/C 完整学习与考试系统', ctaHref: '/radio/cn/zh/license/exam/', faq: cnFaq, officialSources: [sources.cracBank, sources.miitRules],
  }),
  defineRoute({
    path: '/radio/cn/en/license/', locale: 'en-CN', market: 'CN', structuredDataType: 'Article', alternates: licenseAlternates,
    title: 'China Amateur Radio License Learning Guide | Radio Earth',
    description: 'An English navigation guide to China A/B/C learning, the verified 2025 source banks, practice exams and official references.',
    h1: 'China amateur radio learning and verification guide',
    quickAnswer: 'Choose an A, B or C learning path and study the current China source bank. Technical-ability verification and authorization to set up or use a station are related but distinct requirements.',
    requirements: ['Use the China 2025 source-bank version.', 'Confirm current eligibility and station requirements with Chinese official sources.'],
    steps: ['Choose A, B or C.', 'Study concepts and source questions.', 'Use the simulator and review mistakes.', 'Check official application information.'],
    sections: [{ heading: 'Verified source-bank coverage', items: ['A: 683 questions', 'B: 1,143 questions', 'C: 1,282 questions'] }],
    cta: 'Open the Chinese exam workspace', ctaHref: '/radio/cn/zh/license/exam/', faq: [], officialSources: [sources.cracBank, sources.miitRules],
  }),
  ...[
    ['a', 'A', '683'], ['b', 'B', '1143'], ['c', 'C', '1282'],
  ].map(([slug, level, count]) => defineRoute({
    path: `/radio/cn/zh/license/${slug}/`, locale: 'zh-CN', market: 'CN', structuredDataType: 'Article', alternates: licenseAlternates,
    title: `${level} 类业余无线电操作技术能力｜2025 新版 ${count} 道源题`,
    description: `${level} 类学习重点、2025 年版 ${count} 道完整源题、知识图谱、模拟考试与错题复盘入口。`,
    h1: `${level} 类业余无线电操作技术能力学习`,
    quickAnswer: `本站完整保留 ${level} 类 ${count} 道 2025 年版权威源题，并在构建前校验题量、唯一题号、章节和 SHA-256。`,
    requirements: ['使用当前题库版本。', '理解法规、操作、技术与安全知识，不只背答案。', '报名条件与安排以官方当前通知为准。'],
    steps: ['查看考点知识图谱。', '浏览完整源题。', '完成随机选项模拟考试。', '复盘错题和薄弱知识点。'],
    sections: [{ heading: '数据完整性', items: [`${count} 道源题`, '题号与章节唯一性检查', '权威源文件 SHA-256 校验', '构建失败即阻止发布'] }],
    cta: `开始 ${level} 类学习`, ctaHref: `/radio/cn/zh/license/exam/?level=${level}`, faq: cnFaq, officialSources: [sources.cracBank, sources.miitRules],
  })),
  defineRoute({
    path: '/radio/cn/zh/license/exam/', locale: 'zh-CN', market: 'CN', structuredDataType: 'WebApplication', alternates: licenseAlternates,
    title: '中国业余无线电 A/B/C 模拟考试与完整题库',
    description: 'A/B/C 类完整题库、知识图谱、随机选项模拟考试、错题本与登录云同步。',
    h1: 'A/B/C 类学习与模拟考试',
    quickAnswer: '选择类别后可在知识图谱、完整题库、模拟考试和错题本之间切换；正式考试的选项顺序可能变化，模拟系统同样随机排列。',
    requirements: ['先选择 A/B/C 类。', '模拟成绩仅用于学习反馈。'],
    steps: ['学习知识点。', '浏览源题。', '完成模拟考试。', '复盘错题。'],
    sections: [{ heading: '登录后的云端能力', items: ['收藏与学习进度', '考试会话与答案保存', '错题与掌握状态同步'] }],
    cta: '进入模拟考试系统', ctaHref: '/radio/cn/zh/license/exam/', faq: cnFaq, officialSources: [sources.cracBank],
  }),
  defineRoute({
    path: '/radio/cn/zh/tools/', locale: 'zh-CN', market: 'CN', structuredDataType: 'WebApplication',
    title: 'HAM 实用工具箱｜呼号地图、通联词典、频段与天馈',
    description: '中国呼号区地图、Q 简语和 HAM 词典、频率划分、字母解释法及天馈计算工具。',
    h1: 'HAM 实用工具箱',
    quickAnswer: '把呼号地图、通联词典、中国频率考点表和天馈计算集中在独立真实 URL 下；工具结果用于学习与估算。',
    requirements: ['核对输入单位。', '频率与功率结论以当前执照和频率划分为准。'],
    steps: ['选择工具。', '输入或检索信息。', '核对来源与适用范围。'],
    sections: [{ heading: '工具范围', items: ['中国呼号区地图', 'Q 简语与 HAM 缩略语', '中国频率划分考点表', '天馈与巴伦计算'] }],
    cta: '打开 HAM 工具箱', ctaHref: '/radio/cn/zh/tools/', faq: cnFaq, officialSources: [sources.miitRules],
  }),

  defineRoute({
    path: '/radio/us/en/ham-radio-license/', locale: 'en-US', market: 'US', structuredDataType: 'Article', alternates: licenseAlternates,
    title: 'Ham Radio License: How to Get Licensed in the US | Radio Earth',
    description: 'A direct US ham radio license guide covering license types, exam steps, current official sources and the path into real radio exploration.',
    h1: 'Get your ham radio license',
    quickAnswer: 'Choose Technician, obtain the identifiers required by the current FCC process, study the current question pool, take an accredited exam, pass it and wait for your FCC license and callsign.',
    requirements: ['Use current NCVEC question-pool material.', 'Confirm FCC and volunteer-examiner steps before submitting information.', 'A US amateur license is normally valid for ten years before renewal.'],
    steps: ['Choose a license class.', 'Prepare the current FCC registration information.', 'Study the current question pool.', 'Take practice exams.', 'Find and pass an accredited exam.', 'Confirm the license and callsign in the FCC record.'],
    sections: [
      { heading: 'US amateur license classes', items: ['Technician — entry level, 35-question written exam', 'General — broader privileges, 35-question written exam', 'Amateur Extra — all available privileges, 50-question written exam'] },
      { heading: 'After the license', items: ['Explore satellites', 'Understand propagation', 'Listen to receivers', 'Learn band plans and callsigns'] },
    ],
    cta: 'Start with the Technician study plan', ctaHref: '/radio/us/en/ham-radio-license/technician/', faq: usFaq, officialSources: [sources.arrlLicense, sources.ncvecTechnician],
  }),
  defineRoute({
    path: '/radio/us/zh/ham-radio-license/', locale: 'zh-US', market: 'US', structuredDataType: 'Article', alternates: licenseAlternates,
    title: '美国 Ham Radio License 中文指南｜Radio Earth',
    description: '中文解释美国 Technician、General、Amateur Extra 三类执照、考试路径与当前官方资料。',
    h1: '美国业余无线电执照怎么考？',
    quickAnswer: '通常从 Technician 开始，按当前 FCC/考试组织流程准备信息，使用有效题库学习并参加认可的考试；通过后等待执照和呼号进入 FCC 记录。',
    requirements: ['使用当前有效的 NCVEC 题库。', '提交个人信息前核对 FCC 与考试组织的当前流程。'],
    steps: ['选择执照等级。', '准备当前流程所需信息。', '学习并模拟考试。', '参加认可考试。', '核对执照与呼号。'],
    sections: [{ heading: '三种执照等级', items: ['Technician：35 题', 'General：35 题', 'Amateur Extra：50 题'] }],
    cta: '查看英文 Technician 学习计划', ctaHref: '/radio/us/en/ham-radio-license/technician/', faq: [], officialSources: [sources.arrlLicense, sources.ncvecTechnician],
  }),
  ...[
    ['technician', 'Technician', '35', 'The 2026–2030 Technician pool is the current NCVEC pool for this route.'],
    ['general', 'General', '35', 'General builds on the Technician foundation and opens broader operating privileges.'],
    ['extra', 'Amateur Extra', '50', 'Amateur Extra is the highest current US amateur license class.'],
  ].map(([slug, level, count, note]) => defineRoute({
    path: `/radio/us/en/ham-radio-license/${slug}/`, locale: 'en-US', market: 'US', structuredDataType: 'Article', alternates: licenseAlternates,
    title: `${level} Ham Radio License Study Plan | Radio Earth`,
    description: `A source-aware ${level} study plan, ${count}-question exam overview and official reference path.`,
    h1: `${level} ham radio license`,
    quickAnswer: `${note} The written exam contains ${count} questions; always study from the current authorized pool and errata.`,
    requirements: ['Use current question-pool material and errata.', 'Confirm exam logistics through a recognized examination source.'],
    steps: ['Review the exam scope.', 'Study by topic instead of memorizing letters.', 'Take randomized practice exams.', 'Review missed concepts.', 'Confirm and take an accredited exam.'],
    sections: [{ heading: 'What this page will connect', items: ['Official-source version record', 'Concept study', 'Randomized practice exam', 'Progress and missed-question review'] }],
    cta: 'Return to the US license hub', ctaHref: '/radio/us/en/ham-radio-license/', faq: usFaq, officialSources: slug === 'technician' ? [sources.ncvecTechnician, sources.arrlLicense] : [sources.arrlLicense],
  })),
];

/** @param {string} path */
export function routeForPath(path) {
  const route = radioRoutes.find((item) => item.path === path);
  if (!route) throw new Error(`Unknown radio route: ${path}`);
  return route;
}
