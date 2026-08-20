const node = (id, title, summary = "", children = [], meta = {}) => ({
  id,
  title,
  summary,
  children,
  tags: meta.tags || [],
  points: meta.points || [],
  kind: meta.kind || null,
  level: meta.level || "normal"
});

const leaf = (id, title, summary = "", tags = [], points = [], level = "normal") =>
  node(id, title, summary, [], { tags, points, level });

export const zones = [
  { zone: "1", regions: ["北京市"] },
  { zone: "2", regions: ["黑龙江省", "吉林省", "辽宁省"] },
  { zone: "3", regions: ["天津市", "内蒙古自治区", "河北省", "山西省"] },
  { zone: "4", regions: ["上海市", "山东省", "江苏省"] },
  { zone: "5", regions: ["浙江省", "江西省", "福建省"] },
  { zone: "6", regions: ["安徽省", "河南省", "湖北省"] },
  { zone: "7", regions: ["湖南省", "广东省", "广西壮族自治区", "海南省"] },
  { zone: "8", regions: ["四川省", "重庆市", "贵州省", "云南省"] },
  { zone: "9", regions: ["陕西省", "甘肃省", "宁夏回族自治区", "青海省"] },
  { zone: "0", regions: ["新疆维吾尔自治区", "西藏自治区"] }
];

export const phoneticAlphabet = [
  ["A", "Alfa"], ["B", "Bravo"], ["C", "Charlie"], ["D", "Delta"],
  ["E", "Echo"], ["F", "Foxtrot"], ["G", "Golf"], ["H", "Hotel"],
  ["I", "India"], ["J", "Juliett"], ["K", "Kilo"], ["L", "Lima"],
  ["M", "Mike"], ["N", "November"], ["O", "Oscar"], ["P", "Papa"],
  ["Q", "Quebec"], ["R", "Romeo"], ["S", "Sierra"], ["T", "Tango"],
  ["U", "Uniform"], ["V", "Victor"], ["W", "Whiskey"], ["X", "X-ray"],
  ["Y", "Yankee"], ["Z", "Zulu"]
].map(([letter, word]) => ({ letter, word }));

export const qCodes = [
  { code: "QTH", meaning: "电台位置", detail: "陈述：我的电台位置是……；疑问：你的电台位置在哪里？" },
  { code: "QSL", meaning: "确认收妥", detail: "我确认抄收了你所发送的消息；QSL? 表示询问对方是否确认抄收。" },
  { code: "QRM", meaning: "人为无线电干扰", detail: "受到其他电台或其他人为无线电信号造成的干扰。" },
  { code: "QRN", meaning: "自然噪声干扰", detail: "受到大气、静电等自然来源的无线电噪声干扰。" },
  { code: "QSO", meaning: "无线电联络", detail: "表示能够直接或经转信与某电台通信；HAM 中常泛指一次通联。" },
  { code: "QRP", meaning: "降低发射功率", detail: "请降低发射功率 / 我正在降低发射功率；HAM 中也常指小功率操作。" },
  { code: "QRO", meaning: "增加发射功率", detail: "请增加发射功率 / 我正在增加发射功率。" },
  { code: "QRT", meaning: "停止发送", detail: "停止发射或关闭电台。" },
  { code: "QRV", meaning: "准备完毕", detail: "我已经准备好；QRV? 表示询问对方是否准备好。" },
  { code: "QRZ", meaning: "谁在呼叫我", detail: "QRZ? = 谁在呼叫我？" },
  { code: "QSB", meaning: "信号衰落", detail: "你的信号正在衰落。" },
  { code: "QRQ", meaning: "加快发送", detail: "请加快发送或发报速度。" },
  { code: "QRS", meaning: "放慢发送", detail: "请放慢发送或发报速度。" },
  { code: "QRU", meaning: "没有消息", detail: "我没有消息 / 已无事。" },
  { code: "QSP", meaning: "转信", detail: "我可以为你向某电台转信。" },
  { code: "QSX", meaning: "指定频率守听", detail: "正在指定的频率上守听。" },
  { code: "QSY", meaning: "改变频率", detail: "改变发射频率到指定频率。" },
  { code: "QSK", meaning: "CW 间隙插入", detail: "发报时可在电码间隙中听到对方插入。" },
  { code: "QSD", meaning: "发报存在缺陷", detail: "键控或发报手法存在缺陷。" }
];

export const bands = [
  { name: "40 m", range: "7.0–7.2 MHz", group: "HF", aAllowed: false, power: "A 类不可操作", note: "低于 A 类 30 MHz 下限" },
  { name: "20 m", range: "14.0–14.35 MHz", group: "HF", aAllowed: false, power: "A 类不可操作", note: "低于 A 类 30 MHz 下限" },
  { name: "15 m", range: "21.0–21.45 MHz", group: "HF", aAllowed: false, power: "A 类不可操作", note: "低于 A 类 30 MHz 下限" },
  { name: "10 m", range: "28.0–29.7 MHz", group: "HF", aAllowed: false, power: "A 类不可操作", note: "整个 10 米波段均低于 30 MHz" },
  { name: "6 m", range: "50–54 MHz", group: "VHF", aAllowed: true, power: "≤25 W", note: "同时服从频率划分及电台执照" },
  { name: "2 m", range: "144–148 MHz", group: "VHF", aAllowed: true, power: "≤25 W", note: "145.8–146 MHz 为卫星业余业务重点避让段" },
  { name: "70 cm", range: "430–440 MHz", group: "UHF", aAllowed: true, power: "≤25 W", note: "业余业务为次要业务；435–438 MHz 为卫星业余业务重点避让段" },
  { name: "13 cm", range: "2300–2450 MHz", group: "UHF", aAllowed: true, power: "≤25 W", note: "位于 A 类 30–3000 MHz 能力范围内，实际工作仍以频率划分和执照为准" }
];

export const emissionClasses = [
  { code: "A1A", name: "等幅电报 / CW", chars: ["A：双边带幅度类", "1：单路数字信息、不使用调制副载波", "A：供人工听抄的电报"] },
  { code: "J3E", name: "单边带语音 / SSB", chars: ["J：单边带、抑制载波", "3：单路模拟信息", "E：电话 / 话音"] },
  { code: "F3E", name: "调频语音 / FM", chars: ["F：频率调制", "3：单路模拟信息", "E：电话 / 话音"] },
  { code: "F3F", name: "调频图像 / 电视类信号", chars: ["F：频率调制", "3：单路模拟信息", "F：电视 / 图像信息"] }
];

const zoneChildren = zones.map((z) =>
  leaf(`zone-${z.zone}`, `${z.zone} 区`, z.regions.join("、"), ["呼号", "分区", ...z.regions])
);

const phoneticChildren = phoneticAlphabet.map((item) =>
  leaf(`phonetic-${item.letter}`, `${item.letter} · ${item.word}`, `ITU 标准字母解释词：${item.word}`, ["Phonetic", "字母解释法", item.letter, item.word])
);

const qCodeChildren = qCodes.map((item) =>
  leaf(`q-${item.code.toLowerCase()}`, item.code, item.meaning, ["Q简语", item.code, item.meaning], [item.detail])
);

const bandChildren = bands.map((item, index) =>
  leaf(
    `band-${index}`,
    `${item.name} · ${item.range}`,
    item.power,
    ["频段", item.name, item.range, item.group],
    [`A 类：${item.aAllowed ? "允许在相应业余业务频率申请操作" : "不可操作"}`, `功率：${item.power}`, item.note],
    item.aAllowed ? "normal" : "warning"
  )
);

const emissionChildren = emissionClasses.map((item) =>
  leaf(`emission-${item.code.toLowerCase()}`, `${item.code} · ${item.name}`, item.chars.join("；"), ["发射类别", item.code], item.chars)
);

export const knowledgeTree = node(
  "root",
  "HAM A证考试全景知识图谱",
  "法律法规、通联程序、无线电技术、设备电路、安全与应急",
  [
    node("law", "法律法规与无线电管理", "先判断能不能设台、在哪工作、谁来管、出了问题谁负责。", [
      node("law-docs", "法规体系", "A 类考试最先建立的知识骨架。", [
        leaf("law-regulation", "《中华人民共和国无线电管理条例》", "专门针对无线电管理的行政法规，由国务院和中央军事委员会制定。", ["法规", "无线电管理条例"]),
        leaf("law-amateur", "《业余无线电台管理办法》", "业余无线电台专项管理文件，由工业和信息化部制定；新版自 2024 年 3 月 1 日起施行。", ["法规", "业余无线电台管理办法", "2024"]),
        leaf("law-allocation", "《中华人民共和国无线电频率划分规定》", "定义业余业务、卫星业余业务、业余电台并规定频率业务划分。", ["频率划分"])
      ]),
      node("law-terms", "频谱管理三术语", "划分 ≠ 分配 ≠ 指配", [
        leaf("law-allot", "划分", "把频段列入频率划分表，规定可供一种或多种无线电业务使用。"),
        leaf("law-allocate", "分配", "将频率或频道规定给一个或多个部门，在指定区域和条件下使用。"),
        leaf("law-assign", "指配", "把无线电频率或频道批准给具体无线电台使用。")
      ]),
      node("law-primary-secondary", "主要业务 / 次要业务", "次要业务必须保护主要业务。", [
        leaf("law-secondary-1", "不得干扰主要业务", "次要业务不得对已经或未来可能指配的主要业务电台产生有害干扰。"),
        leaf("law-secondary-2", "不得要求主要业务保护", "次要业务不能要求免受主要业务电台的有害干扰。")
      ]),
      node("law-license", "设台许可与执照", "合法设置、使用业余台必须依法取得业余无线电台执照。", [
        leaf("law-license-valid", "执照有效期", "最长不超过 5 年；继续使用应在届满 30 个工作日前申请更换。", ["5年", "30个工作日"]),
        leaf("law-license-change", "变更与注销", "载明事项变化应及时办理变更；终止使用应办理注销。"),
        leaf("law-license-remove", "注销后的设备处理", "执照注销之日起 60 个工作日内拆除电台、天线等附属设备并妥善处理。", ["60个工作日"])
      ]),
      node("law-a-class", "A 类操作权限", "现行新版题库最重要易错点。", [
        leaf("law-a-range", "频率能力范围", "30–3000 MHz。", ["A类", "30MHz", "3000MHz"], [], "important"),
        leaf("law-a-power", "最大发射功率", "不大于 25 W。", ["A类", "25W"], [], "important"),
        leaf("law-a-not-hf", "A 类不能操作传统 HF 业余波段", "7 MHz、14 MHz、21 MHz、28 MHz 等均低于 30 MHz。", ["HF", "易错"], [], "warning")
      ]),
      node("law-use", "业余电台用途边界", "业余业务用于自我训练、相互通信和技术研究。", [
        leaf("law-use-ok", "允许用途", "自我训练、相互通信、技术研究。"),
        leaf("law-use-commercial", "禁止商业用途", "不得利用业余无线电台谋取商业利益。"),
        leaf("law-use-broadcast", "不得广播 / 通播", "未经批准不得广播、转播广播节目、电话或互联网聊天等。"),
        leaf("law-use-secret", "必须使用明语", "使用明语或业余无线电领域公认的缩略语、简语，不得使用自造暗语。")
      ]),
      node("law-repeater", "中继台与信标台", "两种台站定义不要混淆。", [
        leaf("repeater", "业余中继台", "接收并放大转发业余无线电信号，用来扩大通联范围。"),
        leaf("beacon", "业余信标台", "发射信标信号，辅助验证电波传播条件的单发业余无线电台。")
      ])
    ]),

    node("comm", "通联规范与通联程序", "呼号、分区、CQ、Q 简语、RST、QSL。", [
      node("callsign-structure", "中国业余呼号结构", "前缀 + 电台种类 + 分区编号 + 后缀", [
        leaf("callsign-prefix", "第一部分 · 前缀", "一位字母；中国呼号前缀为 B。"),
        leaf("callsign-type", "第二部分 · 电台种类", "一般业余台常用 G、H、I、D、A、B、C、E、F、K、L；J 为空间业余台；R 为中继台/信标台。"),
        leaf("callsign-zone", "第三部分 · 分区编号", "一位数字，用于表示业余无线电台分区。"),
        leaf("callsign-suffix", "第四部分 · 后缀", "1–4 位字母或字母数字组合；QOA–QUZ、SOS、XXX、TTT 等组合禁用或保留。")
      ]),
      node("zones", "中国呼号分区 1–0", "完整省、自治区、直辖市映射。", zoneChildren, { kind: "zones", tags: ["分区", "中国地图"] }),
      node("callsign-use", "呼号发送规则", "建立、过程中、结束三个时间点。", [
        leaf("callsign-start", "通信建立时", "主动发送完整本台呼号。"),
        leaf("callsign-10min", "通信过程中", "不定期发送完整呼号，间隔不得超过 10 分钟。", ["10分钟"]),
        leaf("callsign-end", "通信结束时", "主动发送完整本台呼号。"),
        leaf("callsign-full", "必须使用完整呼号", "不能使用姓名、外号、呼号后缀或“地区码+后缀”代替法定完整呼号。")
      ]),
      node("phonetic", "ITU 字母解释法 A–Z", "用于清晰拼读呼号及重要字母内容。", phoneticChildren, { kind: "phonetic", tags: ["Phonetic Alphabet", "字母解释法"] }),
      node("cq", "CQ 与建立通联", "CQ 是非特指地呼叫任一国内或国外业余电台。", [
        leaf("cq-listen", "呼叫前先守听", "确认频率没有正在进行的通信。"),
        leaf("cq-call", "发起 CQ", "CQ → 己方完整呼号 → 必要时字母解释 → 守听。"),
        leaf("cq-answer", "回答 CQ", "先报对方呼号，再报自己的完整呼号。"),
        leaf("cq-report", "建立通联后", "通常首先交换信号报告。")
      ]),
      node("qcodes", "常用 Q 简语", "QTH、QSL、QRM、QRN、QSO、QRP、QRT 等。", qCodeChildren, { kind: "qcodes", tags: ["Q简语"] }),
      node("rst", "RST 信号报告", "R 可辨度、S 信号强度、T CW 音调质量。", [
        leaf("rst-r", "R · Readability", "可辨度，范围 1–5。"),
        leaf("rst-s", "S · Strength", "信号强度，范围 1–9。"),
        leaf("rst-t", "T · Tone", "CW 音调质量，范围 1–9。"),
        leaf("rst-examples", "典型报告", "话音常见 59、57；CW 常见 599、559。")
      ]),
      node("qsl", "日志与 QSL", "通联记录是 HAM 操作的重要组成部分。", [
        leaf("log-fields", "日志字段", "DATE、TIME、FREQ、MODE、CALL、RST。"),
        leaf("qsl-fields", "QSL 卡内容", "双方呼号、信号报告、时间、方式、频率、操作员签章及本台通信地址。")
      ]),
      node("repeater-procedure", "中继通联", "常见模拟中继频差。", [
        leaf("repeater-144", "144 MHz 中继", "标准同频段收发频差 600 kHz。"),
        leaf("repeater-430", "430 MHz 中继", "标准同频段收发频差 5 MHz。")
      ])
    ]),

    node("tech", "无线电技术与电波传播", "从频率、调制、传播到天馈系统。", [
      leaf("radio-wave", "无线电波", "频率为 3000 GHz 以下、在空间传播的电磁波。", ["3000GHz"]),
      node("bands", "A 类频段与功率", "A 类并非所有业余频段都能操作。", bandChildren, { kind: "bands", tags: ["A类", "频段", "功率"], level: "important" }),
      node("modulation", "调制方式", "AM、FM、PM、SSB、CW。", [
        leaf("am", "AM", "Amplitude Modulation，调幅。"),
        leaf("fm", "FM", "Frequency Modulation，调频。"),
        leaf("pm", "PM", "Phase Modulation，调相。"),
        leaf("ssb", "SSB", "只传送一个边带的调幅发射；HF 话音广泛使用。"),
        leaf("cw", "CW", "等幅电报，在常见基本方式中占用带宽很窄。")
      ]),
      node("emissions", "发射类别", "三个字符分别体现主载波调制方式、调制信号性质和信息类型。", emissionChildren, { kind: "emissions", tags: ["A1A", "J3E", "F3E"] }),
      node("propagation", "电波传播", "不同频段有不同主导传播机制。", [
        leaf("prop-hf", "HF · 电离层传播", "HF 远距离通信的重要机制是电离层反射。"),
        leaf("prop-vhf", "VHF/UHF · 视距传播", "一般情况下以视距传播为主，距离受天线高度显著影响。"),
        leaf("prop-multipath", "多径", "直射波、地面及建筑物反射波叠加，可发生相长或相消。"),
        leaf("prop-duct", "大气波导", "高空逆温可能造成 VHF/UHF 超视距传播。"),
        leaf("prop-es", "突发 E 层", "可能使 VHF 信号传播到上千千米之外。"),
        leaf("prop-tropo", "对流层散射", "VHF/UHF 可出现数百千米超视距传播。"),
        leaf("prop-meteor", "流星余迹散射", "题库重点提到 6 米波段可用于相关实验。"),
        leaf("prop-eme", "EME 月面反射", "弱信号系统需特别重视低噪声前置放大器和天馈损耗。")
      ]),
      node("antenna", "天线、馈线与驻波", "考试中的高频计算与概念区域。", [
        leaf("dipole", "半波偶极", "总长度约为 1/2 波长；0 dBd ≈ 2.15 dBi。"),
        leaf("gp", "1/4λ GP", "垂直振子约 1/4 波长，需要有效地平面。"),
        leaf("polarization", "天线极化", "包括水平、垂直、左旋圆和右旋圆极化；地面近距离通联收发极化应尽量一致。"),
        leaf("feedline", "同轴馈线", "业余无线电通常采用 50 Ω 同轴电缆；频率越高损耗通常越大。"),
        leaf("swr", "SWR", "完美匹配为 1:1；驻波比过高会增加馈线损耗并可能触发发射机保护。")
      ]),
      node("satellite-bands", "卫星业余业务避让", "普通话音及其他通信方式应避让相关卫星子频段。", [
        leaf("sat-10m", "10 m", "29.3–29.51 MHz。"),
        leaf("sat-2m", "2 m", "145.8–146 MHz。"),
        leaf("sat-70cm", "70 cm", "435–438 MHz。")
      ])
    ]),

    node("equip", "设备操作与电路基础", "理解电台面板背后的信号链。", [
      node("electric", "电工基础", "电压、电流、电阻、功率与频率。", [
        leaf("ohm", "欧姆定律", "I = U / R；U = I × R。"),
        leaf("power", "电功率", "P = U × I。"),
        leaf("wave", "波长", "λ = c / f；频率越高，波长越短。"),
        leaf("units", "常用词头", "k=10³、m=10⁻³、M=10⁶、μ=10⁻⁶、G=10⁹、n=10⁻⁹、T=10¹²、p=10⁻¹²。")
      ]),
      node("trx-chain", "收发信机信号链", "理解调制、混频、解调分别发生在哪里。", [
        leaf("modulator", "调制器", "用原始信号控制射频载波的幅度、频率或相位。"),
        leaf("mixer", "混频器", "完成频率变换。"),
        leaf("am-detector", "AM 解调", "通常称为检波。"),
        leaf("fm-discriminator", "FM 解调", "通常称为鉴频。")
      ]),
      node("controls", "常用面板功能", "手台和基地台高频操作缩写。", [
        leaf("ptt", "PTT", "Push To Talk，按键发射。"),
        leaf("sql", "SQL", "静噪阈值控制。"),
        leaf("vox", "VOX", "声控发射。"),
        leaf("ctcss", "CTCSS", "连续亚音调静噪系统，题库范围 67–250.3 Hz。"),
        leaf("dcs", "DCS", "数字亚音静噪。"),
        leaf("dtmf", "DTMF", "双音多频控制。"),
        leaf("nb", "NB", "Noise Blanker，主要抑制脉冲噪声。"),
        leaf("att", "ATT", "输入衰减器，用于减轻强信号使接收前端过载。"),
        leaf("agc", "AGC", "接收机自动增益控制。"),
        leaf("pre", "PRE", "接收前置放大器。"),
        leaf("alc", "ALC", "发射自动电平控制。"),
        leaf("proc", "PROC", "发射语音压缩。")
      ]),
      node("interference", "干扰与滤波", "定位干扰发生在哪一级。", [
        leaf("adjacent", "邻频干扰", "主要依靠中频滤波器的选择性进行抑制。"),
        leaf("image", "镜像干扰", "依靠变频级之前的波段预选滤波器和镜像抑制能力。"),
        leaf("front-overload", "前端过载", "强带外信号可导致互调；可考虑使用 ATT。"),
        leaf("pulse-noise", "脉冲噪声", "可使用 NB 抑制。")
      ]),
      node("power-supply", "电源与测试", "实操型知识。", [
        leaf("power-13v8", "13.8 V 电源", "电源线尽量短、粗，减少发射大电流时的线路压降。"),
        leaf("dummy-load", "假负载", "自制发射设备在取得合法许可前调测时，天线端应连接假负载。"),
        leaf("swr-test", "驻波测试", "选择无人使用的频率，并用稳定连续载波进行测量。")
      ])
    ]),

    node("safety", "安全防护与应急通信", "真正操作中优先级最高的一组知识。", [
      node("safety-voltage", "安全电压", "潮湿条件下特低电压限值。", [
        leaf("safety-ac", "交流", "16 V RMS。", ["16V"], [], "important"),
        leaf("safety-dc", "直流", "33 V。", ["33V"], [], "important")
      ]),
      node("safety-electric", "电气安全", "带电设备维修与保护接地。", [
        leaf("safety-ground", "金属机箱", "应可靠保护接地。"),
        leaf("safety-capacitor", "断电后仍有危险", "高压滤波电容在断电后仍可能保持危险电荷。"),
        leaf("safety-one-hand", "带电操作", "不得已带电维修时，脚与地绝缘并尽量单手操作。"),
        leaf("safety-rf", "射频电击", "与工频相比致死风险可能下降，但皮肤和深层组织灼伤风险显著增加。")
      ]),
      node("lightning", "防雷接地", "接闪器 → 引下线 → 接地体。", [
        leaf("lightning-components", "传统防雷三部分", "接闪器（避雷针）、引下线、接地体。"),
        leaf("lightning-ground", "防雷接地作用", "把接闪器引入的雷击电流有效泄入大地。"),
        leaf("lightning-wire", "引下线", "应尽可能短、粗、直。"),
        leaf("lightning-coax", "同轴避雷器", "多个避雷器地线应先汇接到同一金属条带，再可靠连接室外接地。")
      ]),
      leaf("radiation", "电磁辐射", "空中的 VHF/UHF 无线电信号属于非电离辐射。", ["非电离辐射"]),
      node("emergency", "应急通信", "紧急状态下存在特别规则，但不意味着日常可随意进行公益通信。", [
        leaf("emergency-nonham", "可与非业余台通信", "突发事件应急处置需要时，可以与非业余无线电台通信。"),
        leaf("emergency-content", "通信内容限制", "仅限与突发事件应急处置直接相关的紧急事务。"),
        leaf("emergency-temp", "紧急临时设台", "危及国家安全、公共安全、生命财产安全等情况下，可不经批准临时设台。"),
        leaf("emergency-48h", "48 小时报告", "临时设置、使用后，应在 48 小时内向电台所在地无线电管理机构报告。", ["48小时"], [], "important"),
        leaf("emergency-close", "事后关闭", "紧急情况消除后，应及时关闭临时设置的业余无线电台。")
      ])
    ])
  ]
);

export function flattenKnowledgeTree(root = knowledgeTree) {
  const items = [];
  const parentMap = new Map();

  function walk(item, parentId = null, depth = 0, moduleId = null) {
    const currentModule = depth === 1 ? item.id : moduleId;
    items.push({ ...item, depth, parentId, moduleId: currentModule });
    if (parentId) parentMap.set(item.id, parentId);
    for (const child of item.children || []) {
      walk(child, item.id, depth + 1, currentModule);
    }
  }

  walk(root);
  return { items, parentMap };
}
