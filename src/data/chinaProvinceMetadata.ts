export interface ChinaProvinceMetadata {
  id: string;
  name: string;
  shortName: string;
  prefix: string;
  capital: string;
  zone?: number;
}

export const CHINA_PROVINCE_METADATA: ChinaProvinceMetadata[] = [
  { id: 'BJ', name: '北京市', shortName: '京', prefix: 'BA1 / BD1 / BG1 / BH1 / BY1', capital: '北京', zone: 1 },
  { id: 'HLJ', name: '黑龙江省', shortName: '黑', prefix: 'BA2 / BD2 / BG2 / BH2 / BY2', capital: '哈尔滨', zone: 2 },
  { id: 'JL', name: '吉林省', shortName: '吉', prefix: 'BA2 / BD2 / BG2 / BH2 / BY2', capital: '长春', zone: 2 },
  { id: 'LN', name: '辽宁省', shortName: '辽', prefix: 'BA2 / BD2 / BG2 / BH2 / BY2', capital: '沈阳', zone: 2 },
  { id: 'TJ', name: '天津市', shortName: '津', prefix: 'BA3 / BD3 / BG3 / BH3 / BY3', capital: '天津', zone: 3 },
  { id: 'HEB', name: '河北省', shortName: '冀', prefix: 'BA3 / BD3 / BG3 / BH3 / BY3', capital: '石家庄', zone: 3 },
  { id: 'SX', name: '山西省', shortName: '晋', prefix: 'BA3 / BD3 / BG3 / BH3 / BY3', capital: '太原', zone: 3 },
  { id: 'NM', name: '内蒙古自治区', shortName: '蒙', prefix: 'BA3 / BD3 / BG3 / BH3 / BY3', capital: '呼和浩特', zone: 3 },
  { id: 'SD', name: '山东省', shortName: '鲁', prefix: 'BA4 / BD4 / BG4 / BH4 / BY4', capital: '济南', zone: 4 },
  { id: 'JS', name: '江苏省', shortName: '苏', prefix: 'BA4 / BD4 / BG4 / BH4 / BY4', capital: '南京', zone: 4 },
  { id: 'SH', name: '上海市', shortName: '沪', prefix: 'BA4 / BD4 / BG4 / BH4 / BY4', capital: '上海', zone: 4 },
  { id: 'ZJ', name: '浙江省', shortName: '浙', prefix: 'BA5 / BD5 / BG5 / BH5 / BY5', capital: '杭州', zone: 5 },
  { id: 'JX', name: '江西省', shortName: '赣', prefix: 'BA5 / BD5 / BG5 / BH5 / BY5', capital: '南昌', zone: 5 },
  { id: 'FJ', name: '福建省', shortName: '闽', prefix: 'BA5 / BD5 / BG5 / BH5 / BY5', capital: '福州', zone: 5 },
  { id: 'TW', name: '台湾省', shortName: '台', prefix: 'BV / BX / BM / BN', capital: '台北' },
  { id: 'HEN', name: '河南省', shortName: '豫', prefix: 'BA6 / BD6 / BG6 / BH6 / BY6', capital: '郑州', zone: 6 },
  { id: 'AH', name: '安徽省', shortName: '皖', prefix: 'BA6 / BD6 / BG6 / BH6 / BY6', capital: '合肥', zone: 6 },
  { id: 'HUB', name: '湖北省', shortName: '鄂', prefix: 'BA6 / BD6 / BG6 / BH6 / BY6', capital: '武汉', zone: 6 },
  { id: 'HUN', name: '湖南省', shortName: '湘', prefix: 'BA7 / BD7 / BG7 / BH7 / BY7', capital: '长沙', zone: 7 },
  { id: 'GD', name: '广东省', shortName: '粤', prefix: 'BA7 / BD7 / BG7 / BH7 / BY7', capital: '广州', zone: 7 },
  { id: 'GX', name: '广西壮族自治区', shortName: '桂', prefix: 'BA7 / BD7 / BG7 / BH7 / BY7', capital: '南宁', zone: 7 },
  { id: 'HAN', name: '海南省', shortName: '琼', prefix: 'BA7 / BD7 / BG7 / BH7 / BY7', capital: '海口', zone: 7 },
  { id: 'HK', name: '香港特别行政区', shortName: '港', prefix: 'VR2', capital: '香港' },
  { id: 'MO', name: '澳门特别行政区', shortName: '澳', prefix: 'XX9', capital: '澳门' },
  { id: 'SC', name: '四川省', shortName: '川', prefix: 'BA8 / BD8 / BG8 / BH8 / BY8', capital: '成都', zone: 8 },
  { id: 'CQ', name: '重庆市', shortName: '渝', prefix: 'BA8 / BD8 / BG8 / BH8 / BY8', capital: '重庆', zone: 8 },
  { id: 'GZ', name: '贵州省', shortName: '黔', prefix: 'BA8 / BD8 / BG8 / BH8 / BY8', capital: '贵阳', zone: 8 },
  { id: 'YN', name: '云南省', shortName: '滇', prefix: 'BA8 / BD8 / BG8 / BH8 / BY8', capital: '昆明', zone: 8 },
  { id: 'SNX', name: '陕西省', shortName: '陕', prefix: 'BA9 / BD9 / BG9 / BH9 / BY9', capital: '西安', zone: 9 },
  { id: 'NX', name: '宁夏回族自治区', shortName: '宁', prefix: 'BA9 / BD9 / BG9 / BH9 / BY9', capital: '银川', zone: 9 },
  { id: 'GS', name: '甘肃省', shortName: '甘', prefix: 'BA9 / BD9 / BG9 / BH9 / BY9', capital: '兰州', zone: 9 },
  { id: 'QH', name: '青海省', shortName: '青', prefix: 'BA9 / BD9 / BG9 / BH9 / BY9', capital: '西宁', zone: 9 },
  { id: 'XJ', name: '新疆维吾尔自治区', shortName: '新', prefix: 'BA0 / BD0 / BG0 / BH0 / BY0', capital: '乌鲁木齐', zone: 0 },
  { id: 'XZ', name: '西藏自治区', shortName: '藏', prefix: 'BA0 / BD0 / BG0 / BH0 / BY0', capital: '拉萨', zone: 0 },
];
