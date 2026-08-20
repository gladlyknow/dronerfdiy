export interface ChinaProvinceGeo {
  id: string;
  name: string;
  shortName: string;
  zone: number;
  prefix: string;
  capital: string;
  path: string;
  labelX: number;
  labelY: number;
  subPaths?: string[]; // islands / separated enclaves
  maidenheadGrid?: string;
  repeaterStation?: string;
  cqZone?: number;
  ituZone?: number;
}

export interface CoastalSeaLabel {
  name: string;
  x: number;
  y: number;
  angle?: number;
}

export interface RadioStationHub {
  callsign: string;
  city: string;
  province: string;
  zone: number;
  x: number;
  y: number;
  freq: string;
  power?: string;
  desc: string;
}

/**
 * Standard Seamless Topological Map of China (Albers Equal-Area Projection Model)
 * Standard Cartographic Frame: 0 0 1000 800
 * Adjacent provinces share seamless snapping border segments, creating an authentic Rooster/Standard Map silhouette.
 */
export const CHINA_PROVINCES_GEO: ChinaProvinceGeo[] = [
  // ==========================================
  // Zone 1: 北京市 (1区) - Surrounded seamlessly by Hebei
  // ==========================================
  {
    id: 'BJ',
    name: '北京市',
    shortName: '京',
    zone: 1,
    prefix: 'BA1 / BD1 / BG1 / BH1 / BY1',
    capital: '北京',
    maidenheadGrid: 'OM89',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY1PK (国家一级台 / 438.500 MHz)',
    labelX: 712,
    labelY: 282,
    path: 'M 700 270 L 724 266 L 730 286 L 718 298 L 698 290 Z',
  },

  // ==========================================
  // Zone 2: 东北三省 (黑龙江、吉林、辽宁)
  // ==========================================
  {
    id: 'HLJ',
    name: '黑龙江省',
    shortName: '黑',
    zone: 2,
    prefix: 'BA2 / BD2 / BG2 / BH2 / BY2',
    capital: '哈尔滨',
    maidenheadGrid: 'PN05',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY2AA (哈尔滨台 / 439.750 MHz)',
    labelX: 860,
    labelY: 125,
    path: 'M 790 120 L 815 60 L 850 45 L 880 75 L 940 100 L 965 145 L 935 200 L 890 220 L 840 215 L 810 175 Z',
  },
  {
    id: 'JL',
    name: '吉林省',
    shortName: '吉',
    zone: 2,
    prefix: 'BA2 / BD2 / BG2 / BH2 / BY2',
    capital: '长春',
    maidenheadGrid: 'PN03',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY2JL (长春净月台 / 145.100 MHz)',
    labelX: 865,
    labelY: 235,
    path: 'M 810 175 L 840 215 L 890 220 L 935 200 L 940 240 L 905 270 L 855 260 L 800 250 L 785 220 Z',
  },
  {
    id: 'LN',
    name: '辽宁省',
    shortName: '辽',
    zone: 2,
    prefix: 'BA2 / BD2 / BG2 / BH2 / BY2',
    capital: '沈阳',
    maidenheadGrid: 'ON91',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY2LN (沈阳棋盘山 / 438.800 MHz)',
    labelX: 800,
    labelY: 295,
    path: 'M 785 220 L 800 250 L 855 260 L 840 300 L 815 345 L 775 320 L 745 285 L 760 255 Z',
    subPaths: [
      // 长山群岛 (大连外海)
      'M 818 355 L 826 352 L 824 360 Z',
      'M 830 348 L 836 345 L 834 352 Z',
    ],
  },

  // ==========================================
  // Zone 3: 华北/内蒙古 (天津、河北、山西、内蒙古)
  // ==========================================
  {
    id: 'TJ',
    name: '天津市',
    shortName: '津',
    zone: 3,
    prefix: 'BA3 / BD3 / BG3 / BH3 / BY3',
    capital: '天津',
    maidenheadGrid: 'OM89',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY3TJ (天津盘山台 / 438.450 MHz)',
    labelX: 735,
    labelY: 308,
    path: 'M 724 295 L 745 292 L 748 318 L 730 322 Z',
  },
  {
    id: 'HEB',
    name: '河北省',
    shortName: '冀',
    zone: 3,
    prefix: 'BA3 / BD3 / BG3 / BH3 / BY3',
    capital: '石家庄',
    maidenheadGrid: 'OM88',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY3HB (石家庄鹿泉 / 438.600 MHz)',
    labelX: 700,
    labelY: 340,
    path: 'M 685 240 L 725 245 L 760 255 L 745 285 L 775 320 L 750 325 L 748 318 L 724 295 L 730 322 L 735 375 L 705 400 L 680 395 L 665 350 L 685 300 Z',
  },
  {
    id: 'SX',
    name: '山西省',
    shortName: '晋',
    zone: 3,
    prefix: 'BA3 / BD3 / BG3 / BH3 / BY3',
    capital: '太原',
    maidenheadGrid: 'OM77',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY3SX (太原天龙山 / 145.000 MHz)',
    labelX: 640,
    labelY: 360,
    path: 'M 635 300 L 685 300 L 665 350 L 680 395 L 655 425 L 625 415 L 620 340 Z',
  },
  {
    id: 'NM',
    name: '内蒙古自治区',
    shortName: '蒙',
    zone: 3,
    prefix: 'BA3 / BD3 / BG3 / BH3 / BY3',
    capital: '呼和浩特',
    maidenheadGrid: 'OM70',
    cqZone: 23,
    ituZone: 44,
    repeaterStation: 'BY3NM (呼市大青山 / 438.900 MHz)',
    labelX: 620,
    labelY: 240,
    path: 'M 400 300 L 460 250 L 550 240 L 620 220 L 700 180 L 790 120 L 810 175 L 785 220 L 760 255 L 725 245 L 685 240 L 685 300 L 635 300 L 620 340 L 575 355 L 525 365 L 470 345 Z',
  },

  // ==========================================
  // Zone 4: 华东中北 (上海、江苏、山东)
  // ==========================================
  {
    id: 'SD',
    name: '山东省',
    shortName: '鲁',
    zone: 4,
    prefix: 'BA4 / BD4 / BG4 / BH4 / BY4',
    capital: '济南',
    maidenheadGrid: 'OM86',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY4SD (济南千佛山 / 438.500 MHz)',
    labelX: 755,
    labelY: 385,
    path: 'M 705 400 L 735 375 L 750 325 L 775 320 L 815 345 L 835 380 L 795 425 L 740 430 L 700 420 Z',
    subPaths: [
      // 庙岛群岛 / 长岛 (渤海海峡)
      'M 790 328 L 798 325 L 795 333 Z',
    ],
  },
  {
    id: 'JS',
    name: '江苏省',
    shortName: '苏',
    zone: 4,
    prefix: 'BA4 / BD4 / BG4 / BH4 / BY4',
    capital: '南京',
    maidenheadGrid: 'OM92',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY4JS (南京紫金山 / 438.700 MHz)',
    labelX: 785,
    labelY: 470,
    path: 'M 740 430 L 795 425 L 825 465 L 835 520 L 805 525 L 780 500 L 735 470 Z',
  },
  {
    id: 'SH',
    name: '上海市',
    shortName: '沪',
    zone: 4,
    prefix: 'BA4 / BD4 / BG4 / BH4 / BY4',
    capital: '上海',
    maidenheadGrid: 'PM01',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY4AA (东方明珠/佘山台 / 438.100 MHz)',
    labelX: 838,
    labelY: 520,
    path: 'M 835 520 L 850 515 L 848 535 L 830 535 Z',
    subPaths: [
      // 崇明岛
      'M 832 505 L 848 498 L 845 508 Z',
    ],
  },

  // ==========================================
  // Zone 5: 华东东南三省及台湾省 (浙江、江西、福建、台湾)
  // ==========================================
  {
    id: 'ZJ',
    name: '浙江省',
    shortName: '浙',
    zone: 5,
    prefix: 'BA5 / BD5 / BG5 / BH5 / BY5',
    capital: '杭州',
    maidenheadGrid: 'PM00',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY5ZA (杭州北高峰 / 438.550 MHz)',
    labelX: 805,
    labelY: 565,
    path: 'M 805 525 L 830 535 L 848 535 L 835 595 L 795 615 L 775 585 L 780 540 Z',
    subPaths: [
      // 舟山群岛与嵊泗列岛
      'M 852 540 L 862 535 L 858 548 Z',
      'M 850 558 L 858 554 L 854 564 Z',
      // 一江山岛、大陈岛
      'M 842 595 L 848 592 L 845 600 Z',
    ],
  },
  {
    id: 'JX',
    name: '江西省',
    shortName: '赣',
    zone: 5,
    prefix: 'BA5 / BD5 / BG5 / BH5 / BY5',
    capital: '南昌',
    maidenheadGrid: 'OL78',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY5JX (南昌梅岭台 / 438.300 MHz)',
    labelX: 735,
    labelY: 595,
    path: 'M 725 520 L 760 520 L 780 540 L 775 585 L 765 650 L 715 655 L 705 585 Z',
  },
  {
    id: 'FJ',
    name: '福建省',
    shortName: '闽',
    zone: 5,
    prefix: 'BA5 / BD5 / BG5 / BH5 / BY5',
    capital: '福州',
    maidenheadGrid: 'OL86',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY5FJ (福州鼓山台 / 438.450 MHz)',
    labelX: 790,
    labelY: 645,
    path: 'M 775 585 L 795 615 L 835 595 L 815 680 L 775 690 L 765 650 Z',
    subPaths: [
      // 平潭岛 (海坛岛)
      'M 822 642 L 828 638 L 826 648 Z',
      // 金门诸岛
      'M 780 692 L 788 688 L 786 696 Z',
      // 马祖列岛
      'M 820 625 L 826 622 L 824 628 Z',
    ],
  },
  {
    id: 'TW',
    name: '台湾省',
    shortName: '台',
    zone: 5,
    prefix: 'BV / BX / BM / BN',
    capital: '台北',
    maidenheadGrid: 'PL05',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BV2A (台北阳明山台 / 145.000 MHz)',
    labelX: 865,
    labelY: 665,
    path: 'M 855 635 L 875 640 L 880 685 L 860 705 L 845 660 Z',
    subPaths: [
      // 澎湖列岛
      'M 830 670 L 838 665 L 836 676 Z',
      // 钓鱼岛及其附属岛屿
      'M 895 615 L 905 610 L 902 620 Z',
      'M 918 610 L 924 606 L 922 614 Z',
      // 兰屿与绿岛
      'M 872 712 L 878 708 L 876 716 Z',
    ],
  },

  // ==========================================
  // Zone 6: 中原中南 (安徽、河南、湖北)
  // ==========================================
  {
    id: 'HEN',
    name: '河南省',
    shortName: '豫',
    zone: 6,
    prefix: 'BA6 / BD6 / BG6 / BH6 / BY6',
    capital: '郑州',
    maidenheadGrid: 'OM84',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY6HN (郑州嵩山中继 / 438.650 MHz)',
    labelX: 685,
    labelY: 450,
    path: 'M 655 425 L 680 395 L 705 400 L 700 420 L 740 430 L 735 470 L 710 495 L 650 490 L 630 450 Z',
  },
  {
    id: 'AH',
    name: '安徽省',
    shortName: '皖',
    zone: 6,
    prefix: 'BA6 / BD6 / BG6 / BH6 / BY6',
    capital: '合肥',
    maidenheadGrid: 'OM91',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY6AH (合肥大蜀山 / 438.350 MHz)',
    labelX: 755,
    labelY: 495,
    path: 'M 740 430 L 735 470 L 780 500 L 805 525 L 780 540 L 760 520 L 725 520 L 710 495 Z',
  },
  {
    id: 'HUB',
    name: '湖北省',
    shortName: '鄂',
    zone: 6,
    prefix: 'BA6 / BD6 / BG6 / BH6 / BY6',
    capital: '武汉',
    maidenheadGrid: 'OM80',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY6AA (武汉龟山电视塔 / 438.850 MHz)',
    labelX: 670,
    labelY: 525,
    path: 'M 615 485 L 650 490 L 710 495 L 725 520 L 705 585 L 640 575 L 595 540 L 610 505 Z',
  },

  // ==========================================
  // Zone 7: 华南及港澳 (湖南、广东、广西、海南、香港、澳门)
  // ==========================================
  {
    id: 'HUN',
    name: '湖南省',
    shortName: '湘',
    zone: 7,
    prefix: 'BA7 / BD7 / BG7 / BH7 / BY7',
    capital: '长沙',
    maidenheadGrid: 'OL68',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY7HN (长沙岳麓山 / 438.950 MHz)',
    labelX: 665,
    labelY: 605,
    path: 'M 640 575 L 705 585 L 715 655 L 685 680 L 635 670 L 615 620 Z',
  },
  {
    id: 'GD',
    name: '广东省',
    shortName: '粤',
    zone: 7,
    prefix: 'BA7 / BD7 / BG7 / BH7 / BY7',
    capital: '广州',
    maidenheadGrid: 'OL63',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY7KT (广州越秀山骨干中继 / 438.500 MHz)',
    labelX: 715,
    labelY: 695,
    path: 'M 685 680 L 715 655 L 765 650 L 775 690 L 755 725 L 690 735 L 640 735 L 635 705 Z',
    subPaths: [
      // 南澳岛
      'M 785 698 L 792 694 L 790 702 Z',
      // 万山群岛
      'M 725 745 L 732 742 L 730 748 Z',
      // 上下川岛
      'M 688 748 L 695 745 L 692 752 Z',
      // 东沙群岛
      'M 795 755 L 802 750 L 800 758 Z',
    ],
  },
  {
    id: 'GX',
    name: '广西壮族自治区',
    shortName: '桂',
    zone: 7,
    prefix: 'BA7 / BD7 / BG7 / BH7 / BY7',
    capital: '南宁',
    maidenheadGrid: 'OL52',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY7GX (南宁青秀山 / 438.700 MHz)',
    labelX: 600,
    labelY: 695,
    path: 'M 555 645 L 615 620 L 635 670 L 635 705 L 640 735 L 590 755 L 530 725 L 535 670 Z',
    subPaths: [
      // 涠洲岛与斜阳岛
      'M 596 765 L 602 762 L 600 770 Z',
    ],
  },
  {
    id: 'HAN',
    name: '海南省',
    shortName: '琼',
    zone: 7,
    prefix: 'BA7 / BD7 / BG7 / BH7 / BY7',
    capital: '海口',
    maidenheadGrid: 'OL50',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY7HI (海口 / 三亚五指山台 / 145.300 MHz)',
    labelX: 625,
    labelY: 785,
    path: 'M 610 765 L 645 765 L 650 795 L 620 810 L 600 790 Z',
  },
  {
    id: 'HK',
    name: '香港特别行政区',
    shortName: '港',
    zone: 7,
    prefix: 'VR2',
    capital: '香港',
    maidenheadGrid: 'OL72',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'VR2HK (大帽山业余中继 / 145.450 MHz)',
    labelX: 728,
    labelY: 725,
    path: 'M 724 722 L 736 720 L 734 730 L 722 728 Z',
  },
  {
    id: 'MO',
    name: '澳门特别行政区',
    shortName: '澳',
    zone: 7,
    prefix: 'XX9',
    capital: '澳门',
    maidenheadGrid: 'OL62',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'XX9AU (松山业余中继 / 438.000 MHz)',
    labelX: 708,
    labelY: 730,
    path: 'M 705 726 L 715 726 L 713 734 L 704 732 Z',
  },

  // ==========================================
  // Zone 8: 西南 (四川、重庆、贵州、云南)
  // ==========================================
  {
    id: 'SC',
    name: '四川省',
    shortName: '川',
    zone: 8,
    prefix: 'BA8 / BD8 / BG8 / BH8 / BY8',
    capital: '成都',
    maidenheadGrid: 'OM40',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY8AA (成都龙泉山基地 / 438.800 MHz)',
    labelX: 495,
    labelY: 535,
    path: 'M 425 450 L 500 455 L 545 490 L 575 510 L 565 570 L 540 615 L 485 640 L 450 600 L 420 545 Z',
  },
  {
    id: 'CQ',
    name: '重庆市',
    shortName: '渝',
    zone: 8,
    prefix: 'BA8 / BD8 / BG8 / BH8 / BY8',
    capital: '重庆',
    maidenheadGrid: 'OM59',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY8CQ (重庆南山一棵树 / 438.600 MHz)',
    labelX: 585,
    labelY: 545,
    path: 'M 575 510 L 610 505 L 595 540 L 615 620 L 570 605 L 565 570 Z',
  },
  {
    id: 'GZ',
    name: '贵州省',
    shortName: '黔',
    zone: 8,
    prefix: 'BA8 / BD8 / BG8 / BH8 / BY8',
    capital: '贵阳',
    maidenheadGrid: 'OL56',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY8GZ (贵阳黔灵山 / 438.450 MHz)',
    labelX: 565,
    labelY: 625,
    path: 'M 540 615 L 570 605 L 615 620 L 555 645 L 535 670 L 505 650 Z',
  },
  {
    id: 'YN',
    name: '云南省',
    shortName: '滇',
    zone: 8,
    prefix: 'BA8 / BD8 / BG8 / BH8 / BY8',
    capital: '昆明',
    maidenheadGrid: 'NL45',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY8YN (昆明西山龙门 / 145.250 MHz)',
    labelX: 465,
    labelY: 690,
    path: 'M 450 600 L 485 640 L 505 650 L 535 670 L 530 725 L 490 770 L 415 745 L 420 670 Z',
  },

  // ==========================================
  // Zone 9: 西北 (陕西、甘肃、青海、宁夏)
  // ==========================================
  {
    id: 'SNX',
    name: '陕西省',
    shortName: '陕',
    zone: 9,
    prefix: 'BA9 / BD9 / BG9 / BH9 / BY9',
    capital: '西安',
    maidenheadGrid: 'OM74',
    cqZone: 24,
    ituZone: 44,
    repeaterStation: 'BY9AA (西安终南山中继 / 438.500 MHz)',
    labelX: 615,
    labelY: 440,
    path: 'M 575 355 L 620 340 L 625 415 L 655 425 L 630 450 L 650 490 L 615 485 L 575 510 L 545 490 L 565 435 L 550 395 Z',
  },
  {
    id: 'NX',
    name: '宁夏回族自治区',
    shortName: '宁',
    zone: 9,
    prefix: 'BA9 / BD9 / BG9 / BH9 / BY9',
    capital: '银川',
    maidenheadGrid: 'OM68',
    cqZone: 23,
    ituZone: 44,
    repeaterStation: 'BY9NX (银川贺兰山 / 145.150 MHz)',
    labelX: 550,
    labelY: 360,
    path: 'M 525 365 L 575 355 L 550 395 L 525 385 Z',
  },
  {
    id: 'GS',
    name: '甘肃省',
    shortName: '甘',
    zone: 9,
    prefix: 'BA9 / BD9 / BG9 / BH9 / BY9',
    capital: '兰州',
    maidenheadGrid: 'OM56',
    cqZone: 23,
    ituZone: 44,
    repeaterStation: 'BY9GS (兰州白塔山 / 438.750 MHz)',
    labelX: 450,
    labelY: 380,
    path: 'M 280 320 L 360 300 L 400 300 L 470 345 L 525 365 L 525 385 L 550 395 L 565 435 L 545 490 L 500 455 L 475 460 L 440 410 L 375 380 L 305 380 Z',
  },
  {
    id: 'QH',
    name: '青海省',
    shortName: '青',
    zone: 9,
    prefix: 'BA9 / BD9 / BG9 / BH9 / BY9',
    capital: '西宁',
    maidenheadGrid: 'NL86',
    cqZone: 23,
    ituZone: 43,
    repeaterStation: 'BY9QH (西宁日月山 / 438.300 MHz)',
    labelX: 350,
    labelY: 440,
    path: 'M 305 380 L 375 380 L 440 410 L 475 460 L 500 455 L 425 450 L 420 545 L 340 535 L 260 480 L 265 430 Z',
  },

  // ==========================================
  // Zone 0: 西北/青藏 (新疆、西藏)
  // ==========================================
  {
    id: 'XJ',
    name: '新疆维吾尔自治区',
    shortName: '新',
    zone: 0,
    prefix: 'BA0 / BD0 / BG0 / BH0 / BY0',
    capital: '乌鲁木齐',
    maidenheadGrid: 'NN33',
    cqZone: 23,
    ituZone: 42,
    repeaterStation: 'BY0AA (乌鲁木齐天山台 / 438.900 MHz)',
    labelX: 175,
    labelY: 280,
    path: 'M 85 240 L 150 160 L 220 180 L 280 230 L 360 300 L 280 320 L 305 380 L 265 430 L 195 440 L 140 420 L 60 360 L 50 290 Z',
  },
  {
    id: 'XZ',
    name: '西藏自治区',
    shortName: '藏',
    zone: 0,
    prefix: 'BA0 / BD0 / BG0 / BH0 / BY0',
    capital: '拉萨',
    maidenheadGrid: 'NL19',
    cqZone: 23,
    ituZone: 43,
    repeaterStation: 'BY0XZ (拉萨布达拉山台 / 145.400 MHz)',
    labelX: 230,
    labelY: 535,
    path: 'M 140 420 L 195 440 L 265 430 L 260 480 L 340 535 L 420 545 L 450 600 L 420 670 L 350 630 L 250 635 L 150 590 L 110 520 L 120 460 Z',
  },
];

/**
 * Coastal Waters & Maritime Labels
 */
export const COASTAL_SEAS: CoastalSeaLabel[] = [
  { name: '渤 海', x: 770, y: 350 },
  { name: '黄 海', x: 840, y: 420 },
  { name: '东 海', x: 865, y: 560 },
  { name: '台湾海峡', x: 815, y: 660, angle: -50 },
  { name: '南 海', x: 730, y: 775 },
  { name: '琼州海峡', x: 625, y: 755 },
  { name: '北部湾', x: 560, y: 745 },
];

/**
 * South China Sea Inset (南海诸岛标准附图 - 遵循国家标准地图规范)
 */
export const SOUTH_CHINA_SEA_INSET = {
  viewBox: '0 0 170 230',
  title: '南海诸岛 (第 7 呼号分区)',
  subtitle: '东沙群岛 / 西沙群岛 / 中沙群岛(黄岩岛) / 南沙群岛 / 曾母暗沙',
  islands: [
    { name: '东沙群岛', x: 108, y: 44, radius: 3.5, callsignPrefix: 'BI7 / BV' },
    { name: '西沙群岛 (永兴岛)', x: 64, y: 78, radius: 4.5, callsignPrefix: 'BI7 / BY7' },
    { name: '中沙群岛 (黄岩岛)', x: 120, y: 94, radius: 4.0, callsignPrefix: 'BS7H (黄岩岛DX远征专用呼号)' },
    { name: '南沙群岛 (太平/永暑)', x: 76, y: 150, radius: 5.0, callsignPrefix: 'BI7 / BY7' },
    { name: '曾母暗沙', x: 68, y: 202, radius: 3.0, callsignPrefix: '中国领土最南端 (4°N)' },
  ],
  tenDashLines: [
    'M 140 26 Q 146 42 148 58',
    'M 150 75 Q 148 95 142 114',
    'M 138 128 Q 124 156 106 182',
    'M 92 196 Q 72 214 50 210',
    'M 34 198 Q 22 176 22 148',
    'M 24 128 Q 30 104 36 80',
    'M 42 66 Q 52 46 66 32',
    'M 80 24 Q 100 18 120 20',
    'M 152 146 Q 148 164 140 178',
  ],
};

/**
 * Major Amateur Radio Backbone Hubs across China
 */
export const MAJOR_RADIO_STATIONS: RadioStationHub[] = [
  { callsign: 'BY1PK', city: '北京', province: '北京市', zone: 1, x: 712, y: 282, freq: '438.500 MHz', power: '50W', desc: '新中国第一座业余电台 / 首都国家集体台' },
  { callsign: 'BY4AA', city: '上海', province: '上海市', zone: 4, x: 838, y: 520, freq: '438.100 MHz', power: '45W', desc: '上海市业余无线电俱乐部电台 / 佘山中继' },
  { callsign: 'BY5ZA', city: '杭州', province: '浙江省', zone: 5, x: 805, y: 565, freq: '438.550 MHz', power: '50W', desc: '浙江省无线电运动协会北高峰中继' },
  { callsign: 'BY7KT', city: '广州', province: '广东省', zone: 7, x: 715, y: 695, freq: '438.500 MHz', power: '50W', desc: '广东省越秀山业余骨干中继枢纽' },
  { callsign: 'BV2A', city: '台北', province: '台湾省', zone: 5, x: 865, y: 665, freq: '145.000 MHz', power: '50W', desc: '中国台湾省台北业余无线电台' },
  { callsign: 'VR2HK', city: '香港', province: '香港特区', zone: 7, x: 728, y: 725, freq: '145.450 MHz', power: '50W', desc: '中国香港大帽山特区中继枢纽' },
  { callsign: 'XX9AU', city: '澳门', province: '澳门特区', zone: 7, x: 708, y: 730, freq: '438.000 MHz', power: '30W', desc: '中国澳门松山业余电台中继' },
  { callsign: 'BY8AA', city: '成都', province: '四川省', zone: 8, x: 495, y: 535, freq: '438.800 MHz', power: '50W', desc: '四川省无线电运动协会龙泉山基地' },
  { callsign: 'BY9AA', city: '西安', province: '陕西省', zone: 9, x: 615, y: 440, freq: '438.500 MHz', power: '50W', desc: '陕西省终南山国家业余骨干中继' },
  { callsign: 'BY0AA', city: '乌鲁木齐', province: '新疆', zone: 0, x: 175, y: 280, freq: '438.900 MHz', power: '50W', desc: '新疆天山业余电台枢纽' },
  { callsign: 'BY2AA', city: '哈尔滨', province: '黑龙江', zone: 2, x: 860, y: 125, freq: '439.750 MHz', power: '50W', desc: '黑龙江省哈尔滨业余无线电台' },
  { callsign: 'BY3TJ', city: '天津', province: '天津市', zone: 3, x: 735, y: 308, freq: '438.450 MHz', power: '50W', desc: '天津市盘山业余无线电俱乐部中继' },
  { callsign: 'BS7H', city: '中沙黄岩岛', province: '中沙群岛', zone: 7, x: 795, y: 755, freq: '14.195 MHz', power: '100W', desc: '中沙黄岩岛 DX 远征专用呼号 (名扬全球)' },
];

/**
 * Standard Geographic Graticule Lines (经纬网线)
 */
export const MAP_GRATICULE = {
  meridians: [
    { deg: '80°E', x: 140 },
    { deg: '90°E', x: 280 },
    { deg: '100°E', x: 440 },
    { deg: '110°E', x: 615 },
    { deg: '120°E', x: 770 },
    { deg: '130°E', x: 910 },
  ],
  parallels: [
    { deg: '50°N', y: 100 },
    { deg: '40°N', y: 300 },
    { deg: '30°N', y: 520 },
    { deg: '20°N', y: 720 },
  ],
};
