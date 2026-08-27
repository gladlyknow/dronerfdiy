export type AllocationStatus = '专用' | '唯一主要' | '共同主要' | '次要';
export type SpectrumBand = 'LF' | 'MF' | 'HF' | 'VHF' | 'UHF' | 'EHF';
export type FrequencyScope = 'below30' | '30to3000' | 'above3000';

export interface ExamReference {
  id: string;
  jCode: string;
}

export interface FrequencyAllocation {
  id: string;
  spectrum: SpectrumBand;
  nickname: string;
  range: string;
  startMHz: number;
  endMHz: number;
  scope: FrequencyScope;
  status: AllocationStatus;
  satellite: string;
  relation: string;
  examPoint: string;
  questions: ExamReference[];
}

export interface AllocationRule {
  title: string;
  detail: string;
  question: ExamReference;
}

export interface FrequencyUseWindow {
  id: string;
  category: 'WARC' | '信标保护' | '话音窗口' | '本地避让';
  name: string;
  range: string;
  detail: string;
  question: ExamReference;
}

const ref = (id: string, jCode: string): ExamReference => ({ id, jCode });

const relations: Record<AllocationStatus, string> = {
  专用: '题库口径：该段专用于业余业务与卫星业余业务。',
  唯一主要: '与其他业务共用，但业余业务与卫星业余业务是唯一主要业务。',
  共同主要: '与其他主要业务共用；设台或用频时可能需要协调。',
  次要: '不得干扰主要业务，不得要求主要业务保护；可要求同级次要业务保护。',
};

const combinedSatelliteNote = '题库按业余业务/卫星业余业务合并口径考查；卫星使用还须核对国家划分表、空间无线电规定与执照。';

const allocation = (
  id: string,
  spectrum: SpectrumBand,
  nickname: string,
  range: string,
  startMHz: number,
  endMHz: number,
  scope: FrequencyScope,
  status: AllocationStatus,
  examPoint: string,
  questions: ExamReference[],
  satellite = combinedSatelliteNote,
): FrequencyAllocation => ({
  id,
  spectrum,
  nickname,
  range,
  startMHz,
  endMHz,
  scope,
  status,
  satellite,
  relation: relations[status],
  examPoint,
  questions,
});

/**
 * R2 A 类题库 [P]1.7.1 直接考查的中国内地频率划分条目。
 * 这里是考试辅助表，不代替现行法规、电台执照或地方协调结果。
 */
export const frequencyAllocations: FrequencyAllocation[] = [
  allocation('135k', 'LF', '2200 米', '135.7–137.8 kHz', 0.1357, 0.1378, 'below30', '次要', '我国业余业务最低频段；最大辐射功率另受 1 W（e.i.r.p.）限制。', [ref('MC1-0183', 'LK0148'), ref('MC1-0196', 'LK0161')], '国家划分表在该段明确列业余业务为次要；不得由本速查表直接推定卫星发射权限。'),
  allocation('1m8', 'MF', '160 米', '1.800–2.000 MHz', 1.8, 2, 'below30', '共同主要', '俗称 160 米波段；题库考查 1800–2000 kHz、主要业务。', [ref('MC1-0180', 'LK0145'), ref('MC1-0187', 'LK0152')]),
  allocation('3m5', 'HF', '80 米', '3.500–3.900 MHz', 3.5, 3.9, 'below30', '共同主要', '俗称 80 米波段；不要误记为 3.5–4.0 MHz。', [ref('MC1-0180', 'LK0145'), ref('MC1-0188', 'LK0153')]),
  allocation('5m3515', 'HF', '60 米', '5.3515–5.3665 MHz', 5.3515, 5.3665, 'below30', '次要', '1200 MHz 以下四个次要业务考点之一。', [ref('MC1-0183', 'LK0148')]),
  allocation('7m', 'HF', '40 米', '7.000–7.200 MHz', 7, 7.2, 'below30', '专用', '我国位于 ITU 3 区；40 米波段是 7.0–7.2 MHz。', [ref('MC1-0179', 'LK0144'), ref('MC1-0186', 'LK0151')]),
  allocation('10m1', 'HF', '30 米（WARC）', '10.100–10.150 MHz', 10.1, 10.15, 'below30', '次要', 'WARC 三段之一，也是 1200 MHz 以下次要业务考点。', [ref('MC1-0183', 'LK0148'), ref('MC1-0185', 'LK0150')]),
  allocation('14a', 'HF', '20 米前段', '14.000–14.250 MHz', 14, 14.25, 'below30', '专用', '20 米波段必须拆分记忆：前段专用。', [ref('MC1-0179', 'LK0144'), ref('MC1-0189', 'LK0154')]),
  allocation('14b', 'HF', '20 米后段', '14.250–14.350 MHz', 14.25, 14.35, 'below30', '共同主要', '20 米波段必须拆分记忆：后段与其他业务共同主要。', [ref('MC1-0180', 'LK0145'), ref('MC1-0189', 'LK0154')]),
  allocation('18m', 'HF', '17 米（WARC）', '18.068–18.168 MHz', 18.068, 18.168, 'below30', '共同主要', 'WARC 三段之一；下限的 18.068 不要记成 18.060。', [ref('MC1-0180', 'LK0145'), ref('MC1-0185', 'LK0150')]),
  allocation('21m', 'HF', '15 米', '21.000–21.450 MHz', 21, 21.45, 'below30', '专用', '15 米波段为专用，完整上限为 21.45 MHz。', [ref('MC1-0179', 'LK0144'), ref('MC1-0190', 'LK0155')]),
  allocation('24m', 'HF', '12 米（WARC）', '24.890–24.990 MHz', 24.89, 24.99, 'below30', '共同主要', 'WARC 三段之一；频宽 100 kHz。', [ref('MC1-0180', 'LK0145'), ref('MC1-0185', 'LK0150')]),
  allocation('28m', 'HF', '10 米', '28.000–29.700 MHz', 28, 29.7, 'below30', '专用', '10 米波段为专用；USB 与 FM 的实际占用窗口不同。', [ref('MC1-0179', 'LK0144'), ref('MC1-0191', 'LK0156')]),
  allocation('50m', 'VHF', '6 米', '50.000–54.000 MHz', 50, 54, '30to3000', '共同主要', 'VHF/UHF 范围内作为主要业务的题库答案包含 50 MHz。', [ref('MC1-0181', 'LK0146'), ref('MC1-0192', 'LK0157')]),
  allocation('144a', 'VHF', '2 米前段', '144.000–146.000 MHz', 144, 146, '30to3000', '唯一主要', '2 米波段必须拆分：144–146 MHz 为唯一主要业务。', [ref('MC1-0181', 'LK0146'), ref('MC1-0182', 'LK0147'), ref('MC1-0193', 'LK0158')]),
  allocation('144b', 'VHF', '2 米后段', '146.000–148.000 MHz', 146, 148, '30to3000', '共同主要', '2 米后段 146–148 MHz 与其他业务共同主要。', [ref('MC1-0181', 'LK0146'), ref('MC1-0193', 'LK0158')]),
  allocation('430m', 'UHF', '70 厘米', '430.000–440.000 MHz', 430, 440, '30to3000', '次要', '主要业务为无线电定位和航空无线电导航；业余台必须主动避让。', [ref('MC1-0183', 'LK0148'), ref('MC1-0194', 'LK0159'), ref('MC1-0195', 'LK0160')]),
  allocation('47g', 'EHF', '约 6 毫米', '47.000–47.200 GHz', 47000, 47200, 'above3000', '专用', '专用频段组合题中的毫米波条目。', [ref('MC1-0179', 'LK0144')]),
  allocation('248g', 'EHF', '约 1.2 毫米', '248.000–250.000 GHz', 248000, 250000, 'above3000', '唯一主要', '题库口径中的最高频段，且为唯一主要业务。', [ref('MC1-0184', 'LK0149')]),
];

export const allocationRules: AllocationRule[] = [
  { title: '先服从用频规定', detail: '在次要业务频率或与其他主要业务共同使用的频率上发射时，应遵守无线电管理机构的使用规定。', question: ref('MC1-0174', 'LK0048') },
  { title: '核准范围内平等', detail: '业余电台在无线电管理机构核准其使用的频段内，享有平等的频率使用权。', question: ref('MC1-0175', 'LK0049') },
  { title: '不得干扰主要业务', detail: '次要业务电台不得对主要业务电台产生有害干扰。', question: ref('MC1-0176', 'LK0141') },
  { title: '不得要求主要业务保护', detail: '次要业务电台不得对来自主要业务电台的有害干扰提出保护要求。', question: ref('MC1-0177', 'LK0142') },
  { title: '同级次要业务可受保护', detail: '次要业务可要求保护，不受同一业务或其他次要业务电台的有害干扰。', question: ref('MC1-0178', 'LK0143') },
];

export const frequencyUseWindows: FrequencyUseWindow[] = [
  { id: 'warc', category: 'WARC', name: 'WARC 三段', range: '10.1–10.15 / 18.068–18.168 / 24.89–24.99 MHz', detail: '30 米、17 米、12 米三个 HF 波段。', question: ref('MC1-0185', 'LK0150') },
  { id: 'beacons', category: '信标保护', name: 'IARU 信标避让', range: '14.100 / 18.110 / 21.150 / 24.930 / 28.200 MHz ±500 Hz', detail: '短波发射应避开各信标中心频率上下 500 Hz。', question: ref('MC1-0197', 'LK0162') },
  { id: 'lsb7', category: '话音窗口', name: '7 MHz · LSB', range: '7.030–7.200 MHz', detail: '注意边带占用不能越过频段边界。', question: ref('MC1-0198', 'LK0164') },
  { id: 'usb14', category: '话音窗口', name: '14 MHz · USB', range: '14.100–14.350 MHz', detail: '从 14.100 MHz 起至频段上限。', question: ref('MC1-0199', 'LK0165') },
  { id: 'usb18', category: '话音窗口', name: '18 MHz · USB', range: '18.1105–18.168 MHz', detail: '起点已避开 18.110 MHz 信标 ±500 Hz。', question: ref('MC1-0200', 'LK0166') },
  { id: 'usb21', category: '话音窗口', name: '21 MHz · USB', range: '21.125–21.450 MHz', detail: '排除 21.1495–21.1505 MHz 信标保护窗口。', question: ref('MC1-0201', 'LK0167') },
  { id: 'usb24', category: '话音窗口', name: '24 MHz · USB', range: '24.9305–24.990 MHz', detail: '起点已避开 24.930 MHz 信标 ±500 Hz。', question: ref('MC1-0202', 'LK0168') },
  { id: 'usb28', category: '话音窗口', name: '29 MHz · USB', range: '28.300–29.300 MHz', detail: '29.3 MHz 以上另有卫星与 FM 等规划考点。', question: ref('MC1-0203', 'LK0169') },
  { id: 'fm29', category: '话音窗口', name: '29 MHz · FM', range: '29.510–29.700 MHz', detail: 'FM 话音窗口从 29.51 MHz 起。', question: ref('MC1-0204', 'LK0170') },
  { id: 'avoid144', category: '本地避让', name: '144 MHz 本地联络', range: '避开 144–144.035 / 145.8–146 MHz', detail: '本地联络不要占用题库列出的卫星业余等保留范围。', question: ref('MC1-0205', 'LK0171') },
  { id: 'avoid430', category: '本地避让', name: '430 MHz 本地联络', range: '避开 431.9–432.240 / 435–438 MHz', detail: '本地联络须避开题库明确列出的两个范围。', question: ref('MC1-0206', 'LK0172') },
];

export const allocationSources = {
  regulation: 'https://www.miit.gov.cn/cms_files/filemanager/1226211233/attach/20236/9086700eed45430bafe236efd1096fd3.pdf',
  questionBank: 'https://www.crac.org.cn/userfiles/file/20250728/20250728223921_3630.pdf',
};
