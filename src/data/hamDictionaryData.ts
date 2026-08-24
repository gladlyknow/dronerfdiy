import { getBank } from './bankData';

export type AbbreviationCategory = 'procedure' | 'courtesy' | 'qsl' | 'people' | 'time' | 'technical' | 'antenna';
export type HamTermCategory = 'operating' | 'propagation' | 'mode' | 'equipment' | 'antenna' | 'measurement' | 'digital' | 'safety';

export interface CommunicationAbbreviation {
  questionId: string;
  code: string;
  aliases: string[];
  chinese: string;
  description: string;
  example: string;
  category: AbbreviationCategory;
  sourceAnswer: string;
}

export interface HamTerm {
  term: string;
  english: string;
  aliases: string[];
  category: HamTermCategory;
  definition: string;
  use: string;
}

export const abbreviationCategoryLabels: Record<AbbreviationCategory, string> = {
  procedure: '操作程序', courtesy: '礼貌与会话', qsl: '卡片与邮寄', people: '人员称谓',
  time: '时间与状态', technical: '技术与活动', antenna: '天线缩语',
};

export const hamTermCategoryLabels: Record<HamTermCategory, string> = {
  operating: '操作与通联', propagation: '传播与频率', mode: '调制与模式', equipment: '收发设备',
  antenna: '天线与馈线', measurement: '测量与电气', digital: '数字与卫星', safety: '安全与规范',
};

export const matchesHamQuery = (query: string, fields: string[]) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = fields.join(' ').toLowerCase();
  if (/^[a-z0-9]+$/i.test(normalized) && normalized.length <= 4) {
    return haystack.split(/[^a-z0-9]+/).filter(Boolean).includes(normalized);
  }
  return haystack.includes(normalized);
};

type AbbreviationSeed = [string, string, string[], string, string, string, AbbreviationCategory];
const abbreviationSeeds: AbbreviationSeed[] = [
  ['MC1-0374', '73', ['BEST REGARDS'], '结束联络时的美好祝愿', '业余无线电联络结束前常用的友好致意。', 'TNX FER QSO, 73', 'courtesy'],
  ['MC1-0375', 'ADR / ADDR', ['ADR', 'ADDR'], '地址', '询问或说明 QSL 卡片等邮件的寄送地址。', 'UR ADR?', 'qsl'],
  ['MC1-0376', 'AGN', ['AGAIN'], '再一次 / 请重复', '请求对方再次发送没有抄清的内容。', 'PSE AGN UR CALL', 'procedure'],
  ['MC1-0377', 'AHR', ['ANOTHER'], '另一个 / 另一位', 'Another 的通信压缩拼写，可用于说明另一位操作员等。', 'AHR OP', 'people'],
  ['MC1-0378', 'ARDF', ['AMATEUR RADIO DIRECTION FINDING'], '业余无线电测向', '利用无线电接收和测向技术寻找发射源的活动。', 'ARDF ACTIVITY', 'technical'],
  ['MC1-0379', 'BOX / P O BOX', ['BOX', 'PO BOX', 'P O BOX'], '邮政信箱', '邮寄 QSL 卡片时表示邮政信箱地址。', 'P O BOX 123', 'qsl'],
  ['MC1-0380', 'BURO', ['BUREAU', 'QSL BURO'], 'QSL 卡片管理局', '通过业余无线电组织集中交换 QSL 卡片的渠道。', 'QSL VIA BURO', 'qsl'],
  ['MC1-0381', 'CK', ['CHECK'], '检查', '请求或说明需要核对呼号、抄收内容或设备状态。', 'PSE CK', 'procedure'],
  ['MC1-0382', 'CQ', ['GENERAL CALL'], '发起普遍呼叫', '向不特定业余电台发出建立联络的呼叫。', 'CQ CQ DE BG5ABC', 'procedure'],
  ['MC1-0383', 'DX', ['DISTANCE'], '远地 / 远距离联络', '指距离较远的电台、联络或远征活动。', 'DX STATION', 'technical'],
  ['MC1-0384', 'ES', ['AND'], '和 / 与', 'CW 文本中代替英文 and 的常用缩写。', 'WX ES TEMP', 'courtesy'],
  ['MC1-0385', 'FB', ['FINE BUSINESS'], '很好 / 太棒了', '表示对方信号、操作或消息很好。', 'FB SIG', 'courtesy'],
  ['MC1-0386', 'FER', ['FOR'], '为了 / 对于', 'CW 文本中代替英文 for 的常用拼写。', 'TNX FER QSO', 'courtesy'],
  ['MC1-0387', 'FREQ', ['FREQUENCY'], '频率', '表示工作、守听或切换的无线电频率。', 'MY FREQ 7.074 MHz', 'technical'],
  ['MC1-0388', 'GA', ['GOOD AFTERNOON'], '下午好', '下午联络时使用的问候语。', 'GA OM', 'courtesy'],
  ['MC1-0389', 'GE', ['GOOD EVENING'], '晚上好', '晚间联络时使用的问候语。', 'GE OM', 'courtesy'],
  ['MC1-0390', 'GL', ['GOOD LUCK'], '祝好运', '用于向对方表达祝愿。', 'GL ES 73', 'courtesy'],
  ['MC1-0391', 'GLD', ['GLAD'], '高兴', 'CW 文本中表示 glad。', 'GLD TO MEET U', 'courtesy'],
  ['MC1-0392', 'GM', ['GOOD MORNING'], '早晨好', '早间联络时使用的问候语。', 'GM OM', 'courtesy'],
  ['MC1-0393', 'GMT', ['GREENWICH MEAN TIME'], '格林尼治时间', '题库使用的世界时表达；通联日志中常见 UTC 时间。', '1200 GMT', 'time'],
  ['MC1-0394', 'GN', ['GOOD NIGHT'], '晚安', '夜间结束交谈时使用的问候语。', 'GN ES 73', 'courtesy'],
  ['MC1-0395', 'GND', ['GROUND'], '地面 / 接地', '表示电气地、保护地或射频系统中的接地。', 'CHECK GND', 'technical'],
  ['MC1-0396', 'HNY', ['HAPPY NEW YEAR'], '新年快乐', '新年期间使用的祝福语。', 'HNY ES 73', 'courtesy'],
  ['MC1-0397', 'HPE', ['HOPE'], '希望', 'CW 文本中表示 hope。', 'HPE CU AGN', 'courtesy'],
  ['MC1-0398', 'HPY / HPI', ['HPY', 'HPI', 'HAPPY'], '幸福 / 快乐', 'CW 文本中表示 happy 的常见缩写。', 'HPY HNY', 'courtesy'],
  ['MC1-0399', 'HST', ['HIGH SPEED TELEGRAPHY'], '快速收发报', '高速发送与抄收摩尔斯电码的活动或技能。', 'HST CONTEST', 'technical'],
  ['MC1-0400', 'K', ['OVER'], '发送完毕，守听任意电台', '表示本次发送结束并邀请任意电台回答。', 'CQ CQ DE BG5ABC K', 'procedure'],
  ['MC1-0401', 'KN', ['GO ONLY'], '发送完毕，仅守听指定电台', '表示本次发送结束，只邀请正在联络的指定电台回答。', 'BG5XYZ DE BG5ABC KN', 'procedure'],
  ['MC1-0402', 'MNY TNX / MNI TNX', ['MNY TNX', 'MNI TNX', 'MANY THANKS'], '非常感谢', '表示 many thanks。', 'MNY TNX FER QSO', 'courtesy'],
  ['MC1-0403', 'NW', ['NOW'], '现在', 'CW 文本中表示 now。', 'NW QSY', 'time'],
  ['MC1-0404', 'OM', ['OLD MAN'], '老朋友 / 老伙计', '业余无线电中的友好称谓，与实际年龄无关。', 'GM OM', 'people'],
  ['MC1-0405', 'OP', ['OPERATOR'], '操作员', '表示正在操作业余电台的人。', 'OP LI', 'people'],
  ['MC1-0406', 'PSE / PLS', ['PSE', 'PLS', 'PLEASE'], '请', '请求对方执行某项操作时使用。', 'PSE AGN', 'courtesy'],
  ['MC1-0407', 'R', ['ROGER', 'RECEIVED'], '完全抄收 / 确认', '表示已正确、完整收到对方刚才的内容。', 'R R TNX', 'procedure'],
  ['MC1-0408', 'SAE', ['SELF ADDRESSED ENVELOPE'], '写好收信人地址的信封', '向对方寄送 QSL 请求时附上的回邮信封，未强调已付邮资。', 'SAE ENCLOSED', 'qsl'],
  ['MC1-0409', 'SASE', ['SELF ADDRESSED STAMPED ENVELOPE'], '写好地址并付邮资的回邮信封', '已写好回邮地址并贴邮票或附回邮资的信封。', 'SASE ENCLOSED', 'qsl'],
  ['MC1-0410', 'SRI', ['SORRY'], '抱歉 / 更正', '表示道歉，也常在发送错误后引出更正内容。', 'SRI CALL CORRECTION', 'courtesy'],
  ['MC1-0411', 'TEMP', ['TEMPERATURE'], '温度', '表示气象或设备温度。', 'TEMP 22 C', 'technical'],
  ['MC1-0412', 'TNX / TKS', ['TNX', 'TKS', 'THANKS'], '谢谢', '对消息、报告或联络表达感谢。', 'TNX FER RPRT', 'courtesy'],
  ['MC1-0413', 'TU', ['THANK YOU'], '谢谢你', '简短表达 thank you。', 'TU 73', 'courtesy'],
  ['MC1-0414', 'UR', ['YOUR', 'YOU ARE'], '你的 / 你是', '根据上下文表示 your 或 you are。', 'UR RST 599', 'courtesy'],
  ['MC1-0415', 'WL', ['WILL'], '将要', 'CW 文本中表示 will。', 'WL QSY NW', 'time'],
  ['MC1-0416', 'XYL', ['EX YOUNG LADY'], '妻子', '业余无线电中表示妻子的传统缩语。', 'MY XYL', 'people'],
  ['MC1-0417', 'YL', ['YOUNG LADY'], '女士', '业余无线电中对女性操作员或女士的传统称谓。', 'YL OP', 'people'],
  ['MC1-0418', 'EL / ELE / ELS', ['EL', 'ELE', 'ELS', 'ELEMENT'], '天线单元 / 振子', '表示构成天线的一个或多个导体单元。', '3 EL YAGI', 'antenna'],
  ['MC1-0419', 'DP', ['DIPOLE'], '偶极天线', '表示由两个主要辐射臂构成的偶极天线。', '40M DP', 'antenna'],
  ['MC1-0420', 'GP', ['GROUND PLANE'], '垂直接地天线', '题库中表示带地网或接地平面的垂直天线。', 'VHF GP ANT', 'antenna'],
  ['MC1-0421', 'VER', ['VERTICAL'], '垂直天线', '表示主要采用垂直极化的天线。', 'VER ANT', 'antenna'],
  ['MC1-0422', 'LW', ['LONG WIRE'], '长线天线', '表示相对工作波长较长的线状天线。', 'LW ANT', 'antenna'],
  ['MC1-0423', 'YAGI', ['YAGI-UDA'], '八木天线', '由驱动单元、反射器和一个或多个引向器构成的定向天线。', '3 EL YAGI', 'antenna'],
  ['MC1-0424', 'BEAM', ['BEAM ANTENNA'], '定向天线', '波束集中在特定方向、可获得方向性增益的天线。', 'ROTATE BEAM', 'antenna'],
];

const cwQuestions = new Map(getBank('A').filter((question) => question.sectionCode === '2.4.2').map((question) => [question.id, question]));
const sourceAnswer = (questionId: string) => {
  const question = cwQuestions.get(questionId);
  return question?.answerType.split('').map((key) => question.options.find((option) => option.key === key)?.text).filter(Boolean).join('；') || '';
};

export const communicationAbbreviations: CommunicationAbbreviation[] = abbreviationSeeds.map(
  ([questionId, code, aliases, chinese, description, example, category]) => ({
    questionId, code, aliases, chinese, description, example, category, sourceAnswer: sourceAnswer(questionId),
  }),
);

type HamTermSeed = [string, string, string[], HamTermCategory, string, string];
const hamTermSeeds: HamTermSeed[] = [
  ['呼号', 'Callsign', ['CALL', 'CALL SIGN'], 'operating', '由主管部门指配、用于识别无线电台的字符组合。', '发起、应答和结束联络时按规则报出。'],
  ['设台许可', 'Station authorization', ['电台执照'], 'operating', '允许设置和使用业余无线电台的行政许可。', '操作前核对电台、频率和功率范围。'],
  ['操作能力证明', 'Operator certificate', ['操作证书', 'A/B/C 类'], 'operating', '证明操作人员具备相应业余无线电知识和能力。', '与设台许可共同决定可操作范围。'],
  ['通联', 'Contact', ['QSO', '联络'], 'operating', '两个或多个电台之间完成信息交换的无线电联络。', '记录呼号、时间、频率、模式和报告。'],
  ['守听', 'Listening', ['MONITOR'], 'operating', '在发射前或通联间隙监听工作频率。', '确认频率空闲并避免干扰现有通信。'],
  ['普遍呼叫', 'General call', ['CQ CALL'], 'operating', '向不特定业余电台发起的建立联络呼叫。', '先守听，再清楚报出 CQ 与本台呼号。'],
  ['定向呼叫', 'Directed call', ['SPECIFIC CALL'], 'operating', '只呼叫某个指定电台或指定地区、活动的呼叫。', '减少不相关电台应答并提高效率。'],
  ['信号报告', 'Signal report', ['REPORT', 'RPRT'], 'operating', '对接收信号可辨度、强度及其他特征的评价。', '话音常用 RS，电报常用 RST。'],
  ['RS 报告', 'Readability and Strength', ['RS'], 'operating', '由可辨度 R 和强度 S 组成的话音信号报告。', '向对方报告实际接收质量。'],
  ['RST 报告', 'Readability Strength Tone', ['RST'], 'operating', '由可辨度、强度和音调组成的电报信号报告。', 'CW 联络中交换信号质量。'],
  ['QSL 卡片', 'QSL card', ['确认卡'], 'operating', '确认一次无线电联络的纸质或电子凭证。', '通常记录双方呼号、UTC、频率、模式和报告。'],
  ['通联日志', 'Logbook', ['LOG'], 'operating', '按时间记录电台联络与操作情况的日志。', '用于复盘、奖状申请和合规留存。'],
  ['网路通联', 'Radio net', ['NET'], 'operating', '多个电台按约定频率、时间和控制方式组织的通联。', '应急、值守和专题活动中常见。'],
  ['圆桌通联', 'Round-table QSO', ['ROUND TABLE'], 'operating', '多个电台按顺序轮流发言的通联方式。', '交接发言权时清楚说明下一台呼号。'],
  ['竞赛通联', 'Contest operation', ['CONTEST'], 'operating', '在规定时段和规则下尽可能完成有效联络的活动。', '遵守竞赛交换内容、频段与日志规则。'],
  ['远征通信', 'DXpedition', ['DXPEDITION'], 'operating', '到稀有地区或特殊地点开展的业余无线电活动。', '关注公告的频率、分台和 QSL 方式。'],
  ['便携操作', 'Portable operation', ['/P', 'PORTABLE'], 'operating', '携带设备在临时地点进行的电台操作。', '重点规划供电、接地、天线和环境安全。'],
  ['移动操作', 'Mobile operation', ['/M', 'MOBILE'], 'operating', '在车辆、船舶等移动平台上进行的电台操作。', '注意平台电气噪声、天线固定和当地规则。'],
  ['应急通信', 'Emergency communication', ['EMCOMM'], 'operating', '灾害或通信中断时提供的信息传递支持。', '以准确、简洁和服从统一调度为先。'],
  ['协调世界时', 'Coordinated Universal Time', ['UTC', 'ZULU'], 'operating', '全球无线电日志通用的统一时间基准。', '跨时区记录时避免本地时间混淆。'],

  ['低频', 'Low Frequency', ['LF'], 'propagation', '30–300 kHz 的无线电频率范围。', '理解长波传播与频谱分区。'],
  ['中频', 'Medium Frequency', ['MF'], 'propagation', '300 kHz–3 MHz 的无线电频率范围。', '包含 160 米等相关频段范围。'],
  ['高频', 'High Frequency', ['HF', '短波'], 'propagation', '3–30 MHz 的无线电频率范围。', '短波远距离通信常借助电离层传播。'],
  ['甚高频', 'Very High Frequency', ['VHF', '超短波'], 'propagation', '30–300 MHz 的无线电频率范围。', '常用于本地、视距、中继和卫星通信。'],
  ['特高频', 'Ultra High Frequency', ['UHF'], 'propagation', '300 MHz–3 GHz 的无线电频率范围。', '常见于 70 cm 波段及微波入门应用。'],
  ['超高频', 'Super High Frequency', ['SHF', '微波'], 'propagation', '3–30 GHz 的无线电频率范围。', '用于微波、卫星和高带宽实验。'],
  ['地波', 'Ground wave', ['GROUND WAVE'], 'propagation', '沿地球表面传播、受地面电导率影响的无线电波。', '低频和中频通信中较重要。'],
  ['天波', 'Skywave', ['SKY WAVE'], 'propagation', '经电离层折射或返回地面的无线电传播路径。', '解释短波跨区域和洲际通信。'],
  ['空间波', 'Space wave', ['SPACE WAVE'], 'propagation', '由直射波及地面反射波等组成的传播方式。', 'VHF/UHF 视距通信分析常用。'],
  ['视距传播', 'Line of sight', ['LOS'], 'propagation', '收发天线之间主要沿近似直线路径传播。', '估算 VHF、UHF 和微波链路范围。'],
  ['无线电视距', 'Radio horizon', ['RADIO HORIZON'], 'propagation', '考虑地球曲率和大气折射后的有效无线电视线边界。', '评估高架天线对覆盖距离的影响。'],
  ['电离层', 'Ionosphere', ['IONO'], 'propagation', '含有足够自由电子、能影响无线电传播的高层大气区域。', '分析短波频率选择和传播时段。'],
  ['D 层', 'D layer', ['D REGION'], 'propagation', '白天较明显、常造成较低短波频率吸收的电离层区域。', '理解昼夜低波段传播差异。'],
  ['E 层', 'E layer', ['E REGION'], 'propagation', '可参与中短距离天波传播的电离层区域。', '分析单跳传播和偶发 E。'],
  ['F 层', 'F layer', ['F1', 'F2', 'F REGION'], 'propagation', '对远距离短波传播最重要的高层电离区域。', '选择远距离通信的频率与时段。'],
  ['最高可用频率', 'Maximum Usable Frequency', ['MUF'], 'propagation', '给定路径和时刻能够通过电离层完成通信的最高频率。', '频率过高时信号可能穿透电离层。'],
  ['最低可用频率', 'Lowest Usable Frequency', ['LUF'], 'propagation', '给定通信条件下能保持可用信号质量的最低频率。', '频率过低时吸收和噪声可能占优。'],
  ['临界频率', 'Critical frequency', ['FOF2'], 'propagation', '垂直入射时仍能由相应电离层返回的最高频率。', '辅助判断电离层状态，不等同于斜路径 MUF。'],
  ['跳距', 'Skip distance', ['SKIP DISTANCE'], 'propagation', '一次天波返回地面后距发射点最近的距离。', '用于理解短波覆盖的近端空缺。'],
  ['静区', 'Skip zone', ['SKIP ZONE'], 'propagation', '地波覆盖末端与首个天波落点之间可能接收困难的区域。', '解释近距离听不到而远处可通的现象。'],
  ['衰落', 'Fading', ['QSB'], 'propagation', '接收信号强度随时间起伏变化的现象。', '通过分集、频率选择和重复关键信息减轻影响。'],
  ['多径传播', 'Multipath propagation', ['MULTIPATH'], 'propagation', '信号沿多条路径以不同延迟到达接收点。', '可能造成衰落、失真或数字解码困难。'],
  ['偶发 E', 'Sporadic E', ['ES PROPAGATION', 'SPORADIC-E'], 'propagation', 'E 层局部高电离区引起的异常远距离传播。', 'VHF 远距离联络中需关注其短时变化。'],
  ['对流层传播', 'Tropospheric propagation', ['TROPO'], 'propagation', '由低层大气折射、散射等形成的传播。', 'VHF/UHF 超视距联络可能利用。'],
  ['对流层波导', 'Tropospheric ducting', ['DUCTING'], 'propagation', '特定折射率梯度把电波限制在大气波导中的传播。', '可造成 VHF/UHF 异常远距离接收。'],
  ['灰线传播', 'Grey-line propagation', ['GRAY LINE'], 'propagation', '沿晨昏分界附近出现的传播增强现象。', '低波段远距离联络可关注日出日落时段。'],
  ['太阳黑子数', 'Sunspot number', ['SSN'], 'propagation', '描述太阳黑子活动水平的指标。', '长期判断高波段短波传播趋势。'],
  ['太阳耀斑', 'Solar flare', ['FLARE'], 'propagation', '太阳表面突发的高能辐射事件。', '可能引起短波吸收增强或通信中断。'],
  ['地磁暴', 'Geomagnetic storm', ['K INDEX', 'KP'], 'propagation', '太阳活动扰动地球磁层形成的事件。', '可能削弱常规 HF 传播并增强极区效应。'],

  ['调幅', 'Amplitude Modulation', ['AM', 'A3E'], 'mode', '通过改变载波幅度承载信息的调制方式。', '用于理解载波和边带结构。'],
  ['调频', 'Frequency Modulation', ['FM', 'F3E'], 'mode', '通过改变瞬时频率承载信息的调制方式。', 'VHF/UHF 本地话音通信常用。'],
  ['调相', 'Phase Modulation', ['PM'], 'mode', '通过改变载波相位承载信息的调制方式。', '与角度调制及数字相位键控相关。'],
  ['单边带', 'Single Sideband', ['SSB'], 'mode', '抑制载波并只发送一个边带的幅度调制形式。', '提高短波话音的频谱和功率利用率。'],
  ['上边带', 'Upper Sideband', ['USB'], 'mode', '单边带中保留载波频率以上频谱分量的方式。', '按频段惯例和频率规划选择。'],
  ['下边带', 'Lower Sideband', ['LSB'], 'mode', '单边带中保留载波频率以下频谱分量的方式。', '按频段惯例和频率规划选择。'],
  ['连续波电报', 'Continuous Wave', ['CW', 'A1A'], 'mode', '以通断载波形成摩尔斯码的窄带通信方式。', '适合低信噪比和窄带操作。'],
  ['无线电传打字', 'Radio Teletype', ['RTTY'], 'mode', '利用频移键控等方式传送字符的数字模式。', '进行键盘文字通信和竞赛。'],
  ['相移键控 31', 'Phase Shift Keying 31', ['PSK31'], 'mode', '低速、窄带的相移键控文字通信模式。', '适合键盘到键盘的弱信号联络。'],
  ['FT8', 'Franke-Taylor 8-FSK', ['FT8'], 'mode', '采用同步时隙和结构化短消息的弱信号数字模式。', '严格校时并遵循频率规划操作。'],
  ['FT4', 'Franke-Taylor 4-FSK', ['FT4'], 'mode', '交换周期比 FT8 更短的弱信号数字模式。', '常用于较快节奏的数字竞赛联络。'],
  ['弱信号传播报告器', 'Weak Signal Propagation Reporter', ['WSPR'], 'mode', '以极低速信标信息观察传播路径的数字模式。', '用于传播实验，不作为普通聊天模式。'],
  ['慢扫描电视', 'Slow Scan Television', ['SSTV'], 'mode', '在窄带音频信道中逐行传送静态图像的模式。', '可通过话音收发机配合音频接口使用。'],
  ['分组无线电', 'Packet radio', ['PACKET'], 'mode', '把数据封装成分组并通过无线链路传输的通信方式。', '用于数据交换、节点和自动转发。'],
  ['自动位置报告系统', 'Automatic Packet Reporting System', ['APRS'], 'mode', '基于分组无线电交换位置、状态和短消息的系统。', '用于位置报告、气象与应急态势信息。'],
  ['数字移动无线电', 'Digital Mobile Radio', ['DMR'], 'mode', '采用时分多址等技术的数字话音与数据制式。', '设置色码、时隙和组呼后使用。'],
  ['数字智能技术业余无线电', 'Digital Smart Technologies for Amateur Radio', ['D-STAR'], 'mode', '面向业余无线电的数字话音和数据系统。', '可通过本地或网络互联的中继系统通信。'],
  ['系统融合', 'System Fusion', ['C4FM', 'YSF'], 'mode', '使用 C4FM 的数字/模拟兼容业余无线电系统。', '根据节点或中继配置选择房间和模式。'],
  ['频移键控', 'Frequency Shift Keying', ['FSK'], 'mode', '用若干离散频率状态表示数字符号的调制方式。', 'RTTY 和多种数字模式的基础。'],
  ['音频移频键控', 'Audio Frequency Shift Keying', ['AFSK'], 'mode', '先在音频中形成 FSK，再送入话音发射链路。', '常用于分组无线电和设备音频接口。'],

  ['收发信机', 'Transceiver', ['TRX', 'RIG'], 'equipment', '把接收机和发射机组合在同一设备中的无线电装置。', '按频段、模式、功率和许可范围设置。'],
  ['接收机', 'Receiver', ['RX'], 'equipment', '选择、放大并解调无线电信号的设备。', '关注灵敏度、选择性和动态范围。'],
  ['发射机', 'Transmitter', ['TX'], 'equipment', '产生并调制射频信号后送往天线的设备。', '确保频率稳定、杂散合格和负载匹配。'],
  ['可变频率振荡器', 'Variable Frequency Oscillator', ['VFO'], 'equipment', '可连续或步进改变工作频率的本机振荡系统。', '用于选择接收和发射频率。'],
  ['接收增量调谐', 'Receiver Incremental Tuning', ['RIT', 'CLARIFIER'], 'equipment', '只微调接收频率、不改变主显示或发射频率的功能。', '校正对方轻微频偏。'],
  ['发射增量调谐', 'Transmitter Incremental Tuning', ['XIT'], 'equipment', '只偏移发射频率的功能。', '分频或精细对频时谨慎使用。'],
  ['按键发射', 'Push To Talk', ['PTT'], 'equipment', '控制收发信机从接收切换到发射的信号或按键。', '话音与数据接口均可能使用。'],
  ['声控发射', 'Voice Operated Exchange', ['VOX'], 'equipment', '检测音频后自动切换发射的功能。', '设置触发阈值和延时以免误发射。'],
  ['静噪', 'Squelch', ['SQL'], 'equipment', '在无有效信号时关闭或压低接收音频的电路。', '阈值过高会漏掉弱信号。'],
  ['自动增益控制', 'Automatic Gain Control', ['AGC'], 'equipment', '根据信号强弱自动调整接收链路增益。', '减小强弱信号造成的音量变化。'],
  ['射频增益', 'Radio Frequency Gain', ['RF GAIN'], 'equipment', '手动控制接收射频或中频前端增益的设置。', '强信号环境中适当降低可改善接收。'],
  ['音频增益', 'Audio Frequency Gain', ['AF GAIN', 'VOLUME'], 'equipment', '控制解调后音频输出电平的设置。', '只改变听感音量，不提高射频信噪比。'],
  ['中间频率', 'Intermediate Frequency', ['IF', '中频'], 'equipment', '混频后便于滤波、放大和解调的固定或受控频率。', '决定部分滤波和接收架构。'],
  ['混频器', 'Mixer', ['MIXER'], 'equipment', '把两个信号相乘并产生和频、差频等分量的电路。', '用于变频，也可能产生不需要的混频产物。'],
  ['本机振荡器', 'Local Oscillator', ['LO'], 'equipment', '向混频器提供参考频率的振荡源。', '其稳定度和相位噪声影响整机性能。'],
  ['功率放大器', 'Power Amplifier', ['PA', 'FINAL'], 'equipment', '把射频信号放大到发射所需功率的末级电路。', '保持散热、线性并使用合适负载。'],
  ['低噪声放大器', 'Low Noise Amplifier', ['LNA'], 'equipment', '在尽量少增加噪声的情况下放大微弱信号。', '常靠近天线用于 VHF/UHF/微波接收。'],
  ['衰减器', 'Attenuator', ['ATT'], 'equipment', '按已知量降低射频或音频信号电平的网络。', '强信号环境中保护前端并减轻过载。'],
  ['前置选频器', 'Preselector', ['PRESELECTOR'], 'equipment', '在接收机前端先限制进入的频率范围。', '抑制带外强信号引起的过载。'],
  ['带通滤波器', 'Band-pass filter', ['BPF'], 'equipment', '允许指定频率范围通过、衰减其外频率的滤波器。', '限制带外噪声和互扰。'],
  ['陷波滤波器', 'Notch filter', ['NOTCH'], 'equipment', '对很窄的特定频率进行强衰减的滤波器。', '压制单音载波或音频啸叫。'],
  ['噪声消除器', 'Noise blanker', ['NB'], 'equipment', '检测并抑制脉冲噪声的接收功能。', '对点火等脉冲干扰有效，过强会失真。'],
  ['数字信号处理', 'Digital Signal Processing', ['DSP'], 'equipment', '在数字域完成滤波、解调或降噪等处理。', '改善选择性与操作灵活性。'],
  ['软件定义无线电', 'Software Defined Radio', ['SDR'], 'equipment', '把大量无线电处理功能交由软件和数字计算实现的架构。', '便于频谱观察、模式扩展与实验。'],
  ['中继台', 'Repeater', ['RPT'], 'equipment', '在一个频率接收并在另一个频率重发信号的电台。', '扩大便携台和移动台覆盖范围。'],
  ['双工器', 'Duplexer', ['DUPLEXER'], 'equipment', '使发射机和接收机可共用天线并保持必要隔离的滤波组件。', '中继台安装和调试的关键部件。'],
  ['亚音频静噪', 'Continuous Tone-Coded Squelch System', ['CTCSS', 'PL TONE'], 'equipment', '在话音中叠加低频连续音以控制接收或中继开放。', '它是接入筛选，不是保密手段。'],
  ['数字编码静噪', 'Digitally Coded Squelch', ['DCS', 'DPL'], 'equipment', '用低速数字码控制接收或中继开放的静噪方式。', '收发双方需设置相同代码。'],
  ['电台计算机控制', 'Computer Aided Transceiver', ['CAT', 'RIG CONTROL'], 'equipment', '计算机读取或设置电台频率、模式等状态的接口。', '日志和数字模式软件可联动电台。'],

  ['天线', 'Antenna', ['ANT'], 'antenna', '在导行波与自由空间电磁波之间转换能量的装置。', '按频率、方向、极化、阻抗和安装环境选择。'],
  ['偶极天线', 'Dipole', ['DP', 'DIPOLE'], 'antenna', '由两个主要辐射臂构成的平衡天线。', '半波偶极常作为基础参考天线。'],
  ['垂直天线', 'Vertical antenna', ['VER', 'VERTICAL'], 'antenna', '主要辐射导体垂直安装、通常产生垂直极化的天线。', '本地移动通信和低仰角覆盖常用。'],
  ['垂直接地天线', 'Ground-plane antenna', ['GP', 'GROUND PLANE'], 'antenna', '垂直辐射体配合地网或接地平面的天线。', 'VHF/UHF 基地台及便携架设常见。'],
  ['长线天线', 'Long-wire antenna', ['LW', 'LONG WIRE'], 'antenna', '导线长度相对工作波长较长的线状天线。', '通常需结合匹配器、地线或对地系统调试。'],
  ['八木天线', 'Yagi-Uda antenna', ['YAGI'], 'antenna', '由驱动单元、反射器和引向器组成的端射定向天线。', '测向、卫星和定向远距离通信常用。'],
  ['波束天线', 'Beam antenna', ['BEAM'], 'antenna', '把主要辐射集中到特定方向的定向天线总称。', '需对准目标并留意前后比和波束宽度。'],
  ['环形天线', 'Loop antenna', ['LOOP'], 'antenna', '由闭合导体回路构成的天线。', '可用于接收测向或发射，性能取决于尺寸和调谐。'],
  ['磁环天线', 'Magnetic loop', ['MAG LOOP'], 'antenna', '周长远小于波长、以磁场耦合为主并高 Q 调谐的小环天线。', '空间受限时使用，注意高电压和窄带调谐。'],
  ['端馈天线', 'End-fed antenna', ['EFHW', 'END FED'], 'antenna', '从导线一端馈电的线状天线。', '需使用合适变换与共模抑制并实测。'],
  ['倒 V 天线', 'Inverted-V antenna', ['INV-V'], 'antenna', '中心较高、两臂向下展开的偶极天线构型。', '减少横向占地并便于单支点架设。'],
  ['四分之一波长振子', 'Quarter-wave radiator', ['1/4 WAVE'], 'antenna', '电气长度约为四分之一波长的常见辐射体。', '常与地网或镜像地配合。'],
  ['半波振子', 'Half-wave radiator', ['1/2 WAVE'], 'antenna', '电气长度约为半波长的常见谐振辐射结构。', '偶极和端馈设计的常用起点。'],
  ['天线单元', 'Antenna element', ['EL', 'ELE', 'ELS'], 'antenna', '构成阵列天线的单个导体或辐射结构。', '数量、间距和长度共同决定方向图。'],
  ['驱动单元', 'Driven element', ['DE'], 'antenna', '与馈线直接连接并获得射频能量的阵列单元。', '八木天线中通常是主要受激单元。'],
  ['反射器', 'Reflector', ['REF'], 'antenna', '位于驱动单元后方、用于改变方向图的寄生单元。', '提高前后比并加强前向辐射。'],
  ['引向器', 'Director', ['DIR'], 'antenna', '位于驱动单元前方、把主瓣引向前方的寄生单元。', '多个引向器可提高增益并收窄波束。'],
  ['天线增益', 'Antenna gain', ['GAIN'], 'antenna', '天线在某方向的辐射强度相对参考天线的比值。', '必须同时说明参考基准与方向。'],
  ['波束宽度', 'Beamwidth', ['HPBW'], 'antenna', '主瓣在规定电平点之间的角宽，常以半功率点表示。', '衡量天线指向宽窄。'],
  ['前后比', 'Front-to-back ratio', ['F/B', 'FBR'], 'antenna', '天线主方向与相反方向辐射或接收响应之比。', '评估定向天线抑制后方信号的能力。'],
  ['极化', 'Polarization', ['POL'], 'antenna', '电磁波电场矢量随时间和空间的取向特性。', '收发极化匹配可减少附加损耗。'],
  ['天线阻抗', 'Antenna impedance', ['Z ANT'], 'antenna', '天线馈电点电压与电流的复数比值。', '匹配馈线和发射机时需要测量。'],
  ['谐振', 'Resonance', ['RESONANCE'], 'antenna', '系统感抗与容抗相互抵消的工作状态。', '谐振不自动等于与馈线完全匹配。'],
  ['天线带宽', 'Antenna bandwidth', ['ANT BW'], 'antenna', '天线在规定性能指标内可用的频率范围。', '窄带天线换频时可能需要重新调谐。'],
  ['驻波比', 'Standing Wave Ratio', ['SWR', 'VSWR'], 'antenna', '传输线上最大与最小电压之比，用于反映负载失配程度。', '在发射端和天线端结合损耗综合判断。'],
  ['馈线', 'Feed line', ['FEEDER'], 'antenna', '在发射机、接收机与天线之间传输射频能量的传输线。', '选择合适阻抗、损耗和功率等级。'],
  ['同轴电缆', 'Coaxial cable', ['COAX'], 'antenna', '内外导体同轴、具有屏蔽作用的非平衡传输线。', '业余台站最常见的射频馈线之一。'],
  ['平衡传输线', 'Balanced line', ['TWIN LEAD', 'LADDER LINE'], 'antenna', '两导体对地结构和电位近似对称的传输线。', '损耗较低，但安装需远离金属并正确平衡过渡。'],
  ['巴伦', 'Balanced-unbalanced transformer', ['BALUN'], 'antenna', '在平衡与非平衡系统之间实现变换或共模抑制的器件。', '按阻抗比、频率和功率选型并实测。'],
  ['非平衡变换器', 'Unun', ['UNUN'], 'antenna', '在两个非平衡系统之间进行阻抗变换的射频器件。', '端馈或长线系统中常见，不等同于巴伦。'],
  ['共模电流', 'Common-mode current', ['CMC'], 'antenna', '馈线外表面或多导体同向流动的不期望射频电流。', '可能导致射频回流、方向图畸变和噪声。'],
  ['共模扼流圈', 'Common-mode choke', ['CMC CHOKE', 'CHOKE BALUN'], 'antenna', '对馈线共模电流呈高阻抗的射频器件。', '安装在合适位置以减少馈线参与辐射。'],
  ['天线调谐器', 'Antenna tuning unit', ['ATU', 'TUNER'], 'antenna', '把发射机端看到的阻抗变换到可接受范围的匹配网络。', '不会自动消除馈线损耗或改变天线本体效率。'],
  ['假负载', 'Dummy load', ['DUMMY LOAD'], 'antenna', '把射频功率转为热且尽量少辐射的标准负载。', '用于发射机测试和故障隔离。'],
  ['地网', 'Radial system', ['RADIALS'], 'antenna', '垂直天线下方或附近布置的径向导体系统。', '提供回流路径并改善效率与稳定性。'],
  ['对地线', 'Counterpoise', ['COUNTERPOISE'], 'antenna', '作为天线回流或参考面的导体系统。', '便携和端馈系统中需按实际环境调整。'],
  ['UHF 型连接器', 'UHF connector', ['PL-259', 'SO-239'], 'antenna', '业余电台常见的螺纹射频插头与座组合。', '装配后检查屏蔽、焊接和防水。'],
  ['N 型连接器', 'N connector', ['TYPE N'], 'antenna', '具有较稳定阻抗和防水结构的螺纹射频连接器。', 'VHF、UHF 及户外馈线系统常见。'],
  ['SMA 连接器', 'SubMiniature version A', ['SMA'], 'antenna', '小型螺纹射频连接器。', '手持机和微波设备中常见，避免过度拧紧。'],

  ['电压', 'Voltage', ['U', 'V'], 'measurement', '单位电荷在两点之间的电势能差。', '用电压表并联测量，注意量程与极性。'],
  ['电流', 'Current', ['I', 'A'], 'measurement', '单位时间通过导体截面的电荷量。', '用电流表串联测量，避免直接跨接电源。'],
  ['电阻', 'Resistance', ['R', 'OHM', 'Ω'], 'measurement', '导体对直流电流阻碍程度的物理量。', '断电后测量并注意并联支路影响。'],
  ['电功率', 'Electric power', ['P', 'WATT'], 'measurement', '能量转换或传输速率。', '直流电路常用 P=UI 估算。'],
  ['频率', 'Frequency', ['F', 'Hz'], 'measurement', '周期现象每秒重复的次数。', '与周期互为倒数，并决定无线电波段。'],
  ['波长', 'Wavelength', ['LAMBDA', 'λ'], 'measurement', '波在一个周期内传播的距离。', '真空中可用波速除以频率估算。'],
  ['欧姆定律', "Ohm's law", ['U=IR', 'V=IR'], 'measurement', '线性电阻元件中电压、电流和电阻之间的关系。', '用于基础电路计算和故障分析。'],
  ['分贝', 'Decibel', ['dB'], 'measurement', '表示两个功率或幅度比值的对数量。', '增益和损耗可以按分贝方便相加。'],
  ['毫瓦分贝', 'Decibel-milliwatt', ['dBm'], 'measurement', '以 1 mW 为参考的绝对功率对数单位。', '用于接收电平和链路预算。'],
  ['各向同性增益', 'Gain over isotropic', ['dBi'], 'measurement', '以理想各向同性辐射源为参考的天线增益单位。', '与 dBd 比较时必须留意参考基准。'],
  ['偶极子增益', 'Gain over dipole', ['dBd'], 'measurement', '以半波偶极天线为参考的增益单位。', '阅读天线指标时不要与 dBi 混用。'],
  ['有效值', 'Root mean square', ['RMS'], 'measurement', '交流量按等效发热能力定义的数值。', '计算交流功率与选择测量方式时使用。'],
  ['万用表', 'Multimeter', ['DMM', 'AVOM'], 'measurement', '测量电压、电流、电阻等基础电量的仪表。', '先选功能与量程，再正确连接表笔。'],
  ['频率计', 'Frequency counter', ['COUNTER'], 'measurement', '通过计数周期或脉冲测量频率的仪表。', '检查振荡器和发射频率。'],
  ['射频功率计', 'RF power meter', ['WATTMETER'], 'measurement', '测量射频前向、反射或负载功率的仪表。', '选择适用频率、功率范围和方向。'],
  ['驻波表', 'SWR meter', ['VSWR METER'], 'measurement', '通过前向与反射量估算驻波比的仪表。', '校准后在实际工作频率和功率下测量。'],
  ['示波器', 'Oscilloscope', ['SCOPE'], 'measurement', '显示电信号随时间变化波形的仪器。', '观察音频、控制和低中频波形。'],
  ['频谱分析仪', 'Spectrum analyzer', ['SA'], 'measurement', '显示信号功率随频率分布的仪器。', '观察占用带宽、谐波、杂散和互调。'],
  ['矢量网络分析仪', 'Vector Network Analyzer', ['VNA'], 'measurement', '测量网络散射参数幅度和相位的仪器。', '分析天线阻抗、回波损耗和滤波器。'],
  ['谐波', 'Harmonic', ['HARMONIC'], 'measurement', '频率为基波整数倍的信号分量。', '通过滤波、屏蔽和线性设计限制不必要发射。'],
  ['杂散发射', 'Spurious emission', ['SPURIOUS'], 'measurement', '必要带宽之外、可通过设计与滤波降低的不需要发射。', '检测并确保满足许可与设备要求。'],
  ['互调', 'Intermodulation', ['IMD'], 'measurement', '非线性器件把多个信号混合后产生的新频率分量。', '强信号环境和功放线性评估中重要。'],
  ['噪声底', 'Noise floor', ['NOISE FLOOR'], 'measurement', '系统在没有目标信号时可见的背景噪声电平。', '判断弱信号可检测性和环境干扰。'],
  ['灵敏度', 'Sensitivity', ['MDS'], 'measurement', '接收机在规定质量下接收微弱信号的能力。', '必须结合带宽、模式和测试条件比较。'],
  ['选择性', 'Selectivity', ['SELECTIVITY'], 'measurement', '接收机区分相邻频率信号的能力。', '通过合适滤波带宽减少邻道干扰。'],
  ['动态范围', 'Dynamic range', ['DR'], 'measurement', '系统可同时处理的最弱与最强信号范围。', '强信号环境中比单看灵敏度更有意义。'],

  ['码元速率', 'Symbol rate', ['BAUD'], 'digital', '每秒传输的调制符号数量。', '一个码元可承载一个或多个比特，不能总与比特率等同。'],
  ['比特率', 'Bit rate', ['BPS'], 'digital', '每秒传输的信息比特数量。', '与码元速率、调制阶数和编码共同决定吞吐。'],
  ['瀑布图', 'Waterfall display', ['WATERFALL'], 'digital', '以时间、频率和强度显示信号历史的频谱视图。', '寻找数字信号并辅助调谐。'],
  ['音频接口', 'Audio interface', ['SOUNDCARD'], 'digital', '在电台与计算机之间传送收发音频的接口。', '设置隔离与电平，防止过驱和地环路。'],
  ['终端节点控制器', 'Terminal Node Controller', ['TNC'], 'digital', '在数据终端与无线电之间完成分组协议和调制接口的设备。', '分组无线电和 APRS 系统中使用。'],
  ['数字中继节点', 'Digipeater', ['DIGI'], 'digital', '接收分组并按规则再次转发的数字节点。', '扩展 APRS 等分组系统覆盖。'],
  ['网格定位码', 'Maidenhead Locator', ['GRID', 'GRID SQUARE', 'LOCATOR'], 'digital', '用字母和数字编码地理位置的全球网格系统。', 'VHF、卫星和奖状联络常交换。'],
  ['上行链路', 'Uplink', ['UPLINK'], 'digital', '地面电台向卫星或转发器发送信号的链路。', '卫星操作时设置正确频段、极化和多普勒修正。'],
  ['下行链路', 'Downlink', ['DOWNLINK'], 'digital', '卫星或转发器向地面发送信号的链路。', '优先守听自己的下行信号避免过量发射。'],
  ['卫星过境', 'Satellite pass', ['PASS'], 'digital', '卫星从本地地平线升起到落下的可见时间窗口。', '提前计算方位角、仰角和频率变化。'],
  ['方位角', 'Azimuth', ['AZ'], 'digital', '水平方向相对基准北向的角度。', '控制定向天线在水平面指向目标。'],
  ['仰角', 'Elevation', ['EL'], 'digital', '目标方向相对水平面的角度。', '卫星和月面反射天线跟踪中使用。'],
  ['多普勒频移', 'Doppler shift', ['DOPPLER'], 'digital', '收发双方相对运动造成的接收频率变化。', '低轨卫星联络需随过境持续修正。'],
  ['转发器', 'Transponder', ['XPDR'], 'digital', '接收一个频段或频率范围并在另一范围转发的设备。', '卫星线性转发器需控制上行功率。'],
  ['信标', 'Beacon', ['BCN'], 'digital', '周期发送识别或测量信息的无线电发射源。', '用于传播、频率和卫星状态判断。'],
  ['低地球轨道', 'Low Earth Orbit', ['LEO'], 'digital', '高度较低、相对地面快速移动的地球轨道。', '业余卫星过境短且多普勒变化明显。'],
  ['线性转发器', 'Linear transponder', ['LINEAR XPDR'], 'digital', '把一段上行频谱线性搬移到下行频谱的转发器。', '可同时容纳多个窄带信号，必须避免过驱。'],

  ['业余业务', 'Amateur service', ['AMATEUR RADIO'], 'safety', '供业余无线电爱好者自我训练、相互通信和技术研究的无线电业务。', '不得把业余电台用于许可范围外的用途。'],
  ['业余卫星业务', 'Amateur-satellite service', ['AMATEUR SATELLITE'], 'safety', '利用空间电台开展业余业务的无线电业务。', '同时遵守相应频率划分和卫星操作规则。'],
  ['频段规划', 'Band plan', ['BANDPLAN'], 'safety', '对业余频段内不同模式和活动的协调使用建议或规则。', '操作前核对本地区现行规划。'],
  ['主要业务', 'Primary service', ['PRIMARY'], 'safety', '在频率划分中享有主要地位的无线电业务。', '理解同频业务的保护关系。'],
  ['次要业务', 'Secondary service', ['SECONDARY'], 'safety', '不得对主要业务造成有害干扰且不能要求其保护的业务。', '使用相关频段时主动避让主要业务。'],
  ['必要带宽', 'Necessary bandwidth', ['NBW'], 'safety', '保证给定发射类别所需信息速率和质量的最小带宽。', '选择适当模式和滤波器，避免无谓占频。'],
  ['占用带宽', 'Occupied bandwidth', ['OBW'], 'safety', '按规定功率百分比界定的实际发射频谱宽度。', '用合适仪器检查调制和发射质量。'],
  ['电磁兼容', 'Electromagnetic compatibility', ['EMC'], 'safety', '设备在电磁环境中正常工作且不产生不可接受干扰的能力。', '综合使用滤波、接地、布线和屏蔽。'],
  ['电磁干扰', 'Electromagnetic interference', ['EMI'], 'safety', '电磁扰动使设备性能降低或出现异常的现象。', '先定位耦合路径，再采取针对性措施。'],
  ['射频干扰', 'Radio frequency interference', ['RFI'], 'safety', '由射频能量引起的接收或电子设备干扰。', '检查谐波、共模、屏蔽和受扰设备抗扰度。'],
  ['射频暴露', 'Radio-frequency exposure', ['RF EXPOSURE', 'EMF'], 'safety', '人体处于射频电磁场中的状态。', '按现行限值评估功率、频率、距离和占空比。'],
  ['保护接地', 'Protective grounding', ['PE', 'SAFETY GROUND'], 'safety', '把可触及导电外壳可靠连接到保护接地系统。', '在绝缘故障时促使保护装置动作。'],
  ['射频接地', 'RF grounding', ['RF GND'], 'safety', '为射频电流提供低阻抗路径的接地或等效参考系统。', '它与保护接地目的不同，应整体设计。'],
  ['防雷', 'Lightning protection', ['LIGHTNING PROTECTION'], 'safety', '通过接闪、引下、接地和浪涌保护降低雷击风险的系统措施。', '雷暴前断开馈线并按规范做等电位连接。'],
  ['保险丝', 'Fuse', ['FUSE'], 'safety', '过电流时熔断并切断电路的一次性保护器件。', '按电流、分断能力和时间特性正确选型。'],
  ['剩余电流保护器', 'Residual-current device', ['RCD', '漏电保护器'], 'safety', '检测线路电流不平衡并快速切断电源的保护装置。', '不能替代保护接地和过流保护。'],
  ['紧急断电', 'Emergency power-off', ['EPO'], 'safety', '在事故或异常时快速切断台站主要电源的措施。', '开关应易触及、标识清楚并定期检查。'],
  ['拉线', 'Guy wire', ['GUY'], 'safety', '稳定天线桅杆或塔架的张拉构件。', '设置醒目标识、可靠锚固并避开电力线。'],
  ['电池管理系统', 'Battery Management System', ['BMS'], 'safety', '监测并保护电池组电压、电流和温度的电子系统。', '不能替代合适的充电器、保险和人工检查。'],
  ['锂聚合物电池', 'Lithium polymer battery', ['LiPo'], 'safety', '能量密度较高、对过充过放和损伤敏感的锂电池。', '使用匹配充电器、防火环境和安全存放电压。'],
  ['假负载测试', 'Off-air test', ['DUMMY LOAD TEST'], 'safety', '把发射机接入合格假负载进行不占用空中信道的测试。', '检修和调试时优先采用并监测温升。'],
];

export const hamTerms: HamTerm[] = hamTermSeeds.map(([term, english, aliases, category, definition, use]) => ({
  term, english, aliases, category, definition, use,
}));
