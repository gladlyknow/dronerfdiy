import type { CallsignDistrict, KnowledgeNode } from '../types';

export const examCallsignDistricts: CallsignDistrict[] = [
  { zone: 1, name: '第 1 区', provinces: ['北京市'], description: 'A 类题库呼号分区', mnemonic: '北京', badgeColor: 'bg-red-500/20 text-red-600 border-red-500/40' },
  { zone: 2, name: '第 2 区', provinces: ['黑龙江省', '吉林省', '辽宁省'], description: 'A 类题库呼号分区', mnemonic: '黑吉辽', badgeColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40' },
  { zone: 3, name: '第 3 区', provinces: ['天津市', '内蒙古自治区', '河北省', '山西省'], description: 'A 类题库呼号分区', mnemonic: '津蒙冀晋', badgeColor: 'bg-sky-500/20 text-sky-600 border-sky-500/40' },
  { zone: 4, name: '第 4 区', provinces: ['上海市', '山东省', '江苏省'], description: 'A 类题库呼号分区', mnemonic: '沪鲁苏', badgeColor: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/40' },
  { zone: 5, name: '第 5 区', provinces: ['浙江省', '江西省', '福建省'], description: 'A 类题库呼号分区', mnemonic: '浙赣闽', badgeColor: 'bg-violet-500/20 text-violet-600 border-violet-500/40' },
  { zone: 6, name: '第 6 区', provinces: ['安徽省', '河南省', '湖北省'], description: 'A 类题库呼号分区', mnemonic: '皖豫鄂', badgeColor: 'bg-amber-500/20 text-amber-600 border-amber-500/40' },
  { zone: 7, name: '第 7 区', provinces: ['湖南省', '广东省', '广西壮族自治区', '海南省'], description: 'A 类题库呼号分区', mnemonic: '湘粤桂琼', badgeColor: 'bg-orange-500/20 text-orange-600 border-orange-500/40' },
  { zone: 8, name: '第 8 区', provinces: ['四川省', '重庆市', '贵州省', '云南省'], description: 'A 类题库呼号分区', mnemonic: '川渝黔滇', badgeColor: 'bg-teal-500/20 text-teal-600 border-teal-500/40' },
  { zone: 9, name: '第 9 区', provinces: ['陕西省', '甘肃省', '宁夏回族自治区', '青海省'], description: 'A 类题库呼号分区', mnemonic: '陕甘宁青', badgeColor: 'bg-lime-500/20 text-lime-600 border-lime-500/40' },
  { zone: 0, name: '第 0 区', provinces: ['新疆维吾尔自治区', '西藏自治区'], description: 'A 类题库呼号分区', mnemonic: '新藏', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-600 border-fuchsia-500/40' },
];

const leaf = (
  id: string,
  title: string,
  category: KnowledgeNode['category'],
  summary: string,
  detail: string,
  extra: Partial<KnowledgeNode> = {},
): KnowledgeNode => ({
  id,
  title,
  domain: 'radio',
  category,
  level: 2,
  examLevel: 'A',
  summary,
  detail,
  ...extra,
});

export const aKnowledgeTree: KnowledgeNode = {
  id: 'a-root',
  title: '业余无线电 A 证考试全景知识图谱',
  domain: 'radio',
  category: 'law',
  level: 0,
  examLevel: 'A',
  summary: '以 A 类题库为中心的五大知识模块',
  detail: '按知识关系而非题号组织：法律法规、通联程序、无线电技术、设备电路、安全与应急。',
  children: [
    {
      id: 'a-law', title: '⚖️ 法律法规与无线电管理', domain: 'radio', category: 'law', level: 1, examLevel: 'A', sectionCode: '1',
      summary: '法规体系、设台许可、频谱管理、A 类权限与违规边界', detail: '建立“谁管理、怎样许可、什么能做、什么不能做”的法规框架。',
      children: [
        leaf('a-law-rules', '法规体系与管理机构', 'law', '无线电管理条例、业余无线电台管理办法、频率划分规定', '业余无线电台管理办法自 2024 年 3 月 1 日起施行；无线电频谱资源属于国家所有。'),
        leaf('a-law-license', '执照有效期、变更与注销', 'law', '执照最长不超过 5 年；续期需提前 30 个工作日', '继续使用电台，应在执照有效期届满 30 个工作日前申请更换；载明事项变化应及时办理变更。', { trapWarning: '注意是 30 个工作日，不是笼统的 30 日。' }),
        leaf('a-law-scope', 'A 类操作能力范围', 'law', '30–3000 MHz，最大发射功率 ≤25 W', 'A 类不能在 30 MHz 以下发射，因此 7、14、21、28 MHz 等 HF 业余波段不属于 A 类操作能力范围。', { trapWarning: '“业余频段”不等于“A 类可操作频段”。' }),
        leaf('a-law-primary', '主要业务与次要业务', 'law', '次要业务必须保护主要业务', '次要业务不得对主要业务造成有害干扰，也不能要求主要业务为其提供干扰保护。'),
        leaf('a-law-use', '允许用途与禁止行为', 'law', '自我训练、相互通信、技术研究', '不得用于商业盈利、广播音乐、转播电话或互联网聊天、故意干扰等非业余用途。'),
      ],
    },
    {
      id: 'a-comm', title: '📡 通联规范与通联程序', domain: 'radio', category: 'comm', level: 1, examLevel: 'A', sectionCode: '2',
      summary: '呼号、分区、CQ、RST、Q 简语、字母解释法与日志', detail: '建立一套完整的规范通联流程。',
      children: [
        leaf('a-comm-callsign', '中国业余呼号结构与 1～0 分区', 'comm', '中国前缀 B；分区数字位于呼号第三部分', '考试分区表覆盖 31 个大陆省级行政区。地图工具提供 1～0 区完整对照。'),
        leaf('a-comm-cq', 'CQ 与建立通联', 'comm', '先守听，再 CQ；应答时先报对方呼号再报己方呼号', '建立通信后通常首先交换信号报告；通信开始、结束以及过程中间隔不超过 10 分钟发送完整呼号。'),
        leaf('a-comm-rst', 'RST 信号报告', 'comm', 'R 1–5、S 1–9、T 1–9', '话音通常使用 RS 两位报告；CW 通常使用 RST 三位报告。'),
        leaf('a-comm-qcodes', '常用 Q 简语', 'comm', 'QTH/QSL/QRM/QRN/QSO/QRP/QRT 等', 'QTH 地点；QSL 确认收妥；QRM 人为/他台干扰；QRN 自然噪声；QSO 通联；QRP 降低功率；QRT 停止发送。'),
        leaf('a-comm-phonetic', 'ITU 字母解释法 A–Z', 'comm', 'Alfa、Bravo、Charlie … Zulu', '呼号拼读采用国际标准字母解释法；注意 Alfa 与 Juliett 的标准拼写。'),
      ],
    },
    {
      id: 'a-tech', title: '🌐 无线电技术与电波传播', domain: 'radio', category: 'tech', level: 1, examLevel: 'A', sectionCode: '3',
      summary: '频率波长、调制发射类别、传播、天线馈线与驻波', detail: '理解信号如何产生、传播并由天馈系统辐射。',
      children: [
        leaf('a-tech-wave', '频率、波长与无线电波', 'tech', 'λ = c / f；频率越高波长越短', '工程速算常用 λ(m)≈300/f(MHz)。'),
        leaf('a-tech-emission', '发射类别 A1A / J3E / F3E', 'tech', 'A1A=CW，J3E=SSB 语音，F3E=FM 语音', '三个字符依次描述主载波调制方式、调制信号性质、信息类型。'),
        leaf('a-tech-prop', 'VHF/UHF 传播', 'tech', '一般以视距传播为主', '传播距离明显受收发天线高度影响；多径、对流层波导、突发 E 层等可造成特殊传播。'),
        leaf('a-tech-antenna', '天线、馈线与极化', 'tech', '常用 50Ω 同轴馈线；半波偶极 0 dBd≈2.15 dBi', '极化匹配影响链路；频率越高馈线损耗通常越值得关注。'),
        leaf('a-tech-swr', '驻波比 SWR', 'tech', '理想匹配 1:1', '驻波比升高意味着失配和反射增大；发射机可能降低输出以保护功放。'),
      ],
    },
    {
      id: 'a-equip', title: '🛠️ 设备操作与电路基础', domain: 'radio', category: 'tech', level: 1, examLevel: 'A', sectionCode: '4',
      summary: '收发信机控制、调制解调、电工基础与测量', detail: '把手台/车台面板操作与基础电路概念连接起来。',
      children: [
        leaf('a-equip-controls', 'PTT / SQL / VOX / CTCSS / DCS', 'tech', '常用收发信机操作功能', 'PTT 按键发射；SQL 静噪；VOX 声控发射；CTCSS/DCS 用于选择性静噪。'),
        leaf('a-equip-rx', 'NB / ATT / AGC / ALC', 'tech', '噪声抑制、前端衰减、自动增益与发射电平', 'NB 主要针对脉冲噪声；ATT 可减轻强信号过载；AGC 控制接收增益；ALC 防止发射过驱。'),
        leaf('a-equip-demod', '调制、混频与解调', 'tech', 'FM 鉴频、AM 检波、混频完成频率变换', '中频滤波用于提高邻频选择性，前端预选有助于抑制镜像与强带外信号。'),
        leaf('a-equip-ohm', '欧姆定律与电功率', 'tech', 'I=U/R，P=UI', '电压单位 V、电流 A、电阻 Ω、功率 W；掌握 k、M、m、μ 等数量级。'),
        leaf('a-equip-supply', '电源与测试', 'tech', '业余设备常见 13.8V 直流供电', '测驻波应选择无人使用的频率并使用稳定载波，测试完成后立即停止发射。'),
      ],
    },
    {
      id: 'a-safety', title: '🛡️ 安全防护与应急通信', domain: 'radio', category: 'safety', level: 1, examLevel: 'A', sectionCode: '5',
      summary: '电气安全、防雷、电磁环境与应急通信规则', detail: '考试中的安全题也是实际设台的操作底线。',
      children: [
        leaf('a-safe-voltage', '安全特低电压', 'safety', '潮湿且可握持条件：AC 16V RMS，DC 33V', '安全限值要区分交流有效值和直流。'),
        leaf('a-safe-lightning', '防雷接地', 'safety', '接闪器 → 引下线 → 接地体', '引下线应尽可能短、粗、直；同轴避雷器宜汇接到同一接地金属条带。'),
        leaf('a-safe-electric', '电气维修与保护接地', 'safety', '金属机箱可靠保护接地', '断电后高压电容仍可能带电；不得已带电维修时应隔离地面并尽量单手操作。'),
        leaf('a-safe-rf', '射频与电磁环境', 'safety', 'VHF/UHF 属于非电离辐射', '电磁环境限值与频率、有效辐射功率和人体吸收特性有关。'),
        leaf('a-safe-emergency', '应急通信', 'safety', '紧急临时设台后 48 小时内报告', '仅在重大灾害和突发事件等法定应急场景下，可按规定与非业余台通信；紧急情况消除后及时关闭临时电台。'),
      ],
    },
  ],
};

export const flatAKnowledgeNodes: KnowledgeNode[] = [];

const flatten = (node: KnowledgeNode) => {
  flatAKnowledgeNodes.push(node);
  node.children?.forEach(flatten);
};
flatten(aKnowledgeTree);
