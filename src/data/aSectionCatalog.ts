export interface ASectionCatalogItem {
  code: string;
  title: string;
  count: number;
}

export interface AModuleCatalogItem {
  code: '1' | '2' | '3' | '4' | '5';
  title: string;
  count: number;
  sections: ASectionCatalogItem[];
}

const sections: ASectionCatalogItem[] = [
  { code: '1.1.1', title: '法规体系、定义与管理机构', count: 5 },
  { code: '1.1.2', title: '频率划分、分配、指配与业务优先级', count: 21 },
  { code: '1.2.1', title: '设台申请、许可条件与设备要求', count: 14 },
  { code: '1.2.2', title: '执照有效期、变更、注销与拆除', count: 4 },
  { code: '1.2.4', title: '中继台与信标台管理', count: 5 },
  { code: '1.3.1', title: '操作技术能力验证组织与费用', count: 4 },
  { code: '1.3.2', title: 'A/B/C 类能力、资格与功率范围', count: 16 },
  { code: '1.4.1', title: '呼号核发、使用与管理', count: 19 },
  { code: '1.4.2', title: '中国业余无线电台呼号 1～0 分区', count: 10 },
  { code: '1.5.1', title: '合法设台步骤与法定用途', count: 8 },
  { code: '1.5.2', title: '禁止行为与通信内容边界', count: 26 },
  { code: '1.5.3', title: '应急通信与非业余台通信条件', count: 4 },
  { code: '1.6.1', title: '监督检查、频谱资源与无线电管制', count: 10 },
  { code: '1.6.2', title: '违法行为与行政/刑事责任', count: 18 },
  { code: '1.6.3', title: '网络安全法与国家安全法', count: 3 },
  { code: '1.7.1', title: '业余业务频率划分与主/次要业务规则', count: 33 },
  { code: '1.7.2', title: '频段边界、占用带宽与短波使用规则', count: 25 },
  { code: '2.1.1', title: 'ITU 无线电区域划分', count: 3 },
  { code: '2.1.2', title: 'IARU/ITU 频段规划与区域差异', count: 8 },
  { code: '2.1.5', title: 'ITU 字母解释法与呼号拼读', count: 9 },
  { code: '2.2.1', title: 'CQ 呼叫、应答与直接呼叫', count: 8 },
  { code: '2.2.2', title: '守听、插入、Break 与遇险优先', count: 7 },
  { code: '2.2.3', title: '日志、QSL 卡片与确认', count: 8 },
  { code: '2.2.4', title: '中继台通联与标准频差', count: 3 },
  { code: '2.3.1', title: '话音呼叫用语与通联程序', count: 10 },
  { code: '2.4.1', title: 'Q 简语', count: 31 },
  { code: '2.4.2', title: '常用业余无线电英文缩语', count: 51 },
  { code: '2.5.1', title: '调制方式与发射类别', count: 23 },
  { code: '2.6.3', title: '数字语音通信', count: 3 },
  { code: '2.6.4', title: '数字电视与数字图像通信', count: 2 },
  { code: '3.1.1', title: '收发信机基本组成', count: 27 },
  { code: '3.1.3', title: '收发信机面板功能与接收辅助功能', count: 27 },
  { code: '3.3.1', title: '天线作用、增益与参考基准', count: 21 },
  { code: '3.3.2', title: '驻波比 SWR 与匹配', count: 8 },
  { code: '3.3.3', title: '馈线、同轴电缆与连接器', count: 11 },
  { code: '3.3.4', title: '天线极化、方向性与常见天线', count: 20 },
  { code: '3.3.5', title: '多径传播', count: 4 },
  { code: '3.3.6', title: 'VHF/UHF 视距与超视距传播', count: 6 },
  { code: '3.6.1', title: '发射机、接收机、调制解调与射频系统', count: 34 },
  { code: '3.6.3', title: '接收机选择性、灵敏度与抗干扰性能', count: 28 },
  { code: '3.8.1', title: '业余卫星、AMSAT 与 OSCAR', count: 8 },
  { code: '4.1.1', title: '导体、绝缘体与半导体', count: 8 },
  { code: '4.1.2', title: '静电、直流与交流基础', count: 17 },
  { code: '4.1.3', title: '电学量、单位与常用换算', count: 24 },
  { code: '4.1.4', title: '电源、电池与供电基础', count: 10 },
  { code: '4.6.1', title: '万用表与基础测量', count: 8 },
  { code: '5.1.1', title: '发射设备技术指标、频率容限与杂散', count: 8 },
  { code: '5.1.2', title: '电磁环境与公众曝露限值', count: 5 },
  { code: '5.1.3', title: '防雷与接地', count: 7 },
  { code: '5.1.4', title: '安全电压、触电与射频安全', count: 8 },
  { code: '5.1.5', title: '蓄电池与电气火灾安全', count: 3 },
];

const moduleMeta: Record<string, { title: string; count: number }> = {
  '1': { title: '法律法规与无线电管理', count: 225 },
  '2': { title: '通联规范与通联程序', count: 166 },
  '3': { title: '无线电技术与电波传播', count: 194 },
  '4': { title: '设备操作与电路基础', count: 67 },
  '5': { title: '安全防护与应急通信', count: 31 },
};

export const A_MODULE_CATALOG: AModuleCatalogItem[] = (['1', '2', '3', '4', '5'] as const).map((code) => ({
  code,
  title: moduleMeta[code].title,
  count: moduleMeta[code].count,
  sections: sections.filter((item) => item.code.startsWith(`${code}.`)),
}));

export const A_SECTION_CATALOG = sections;
export const A_EXPECTED_QUESTION_COUNT = 683;
export const A_EXPECTED_SECTION_COUNT = 51;
