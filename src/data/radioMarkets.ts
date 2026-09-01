export type RadioMarket = 'cn' | 'us';
export type RadioLocale = 'zh' | 'en';

export interface RadioMarketConfig {
  country: 'CN' | 'US';
  label: Record<RadioLocale, string>;
  notice: Record<RadioLocale, string>;
  licenseSystem: 'CRAC_ABC' | 'FCC_TGE';
  frequencyPlan: string;
  regulator: string;
  callsignSystem: string;
  mapProvider: 'china' | 'global';
}

export const radioMarkets: Record<RadioMarket, RadioMarketConfig> = {
  cn: {
    country: 'CN',
    label: { zh: '中国', en: 'China' },
    notice: {
      zh: '学习内容采用中国市场与官方来源。Radio Earth V1 仅用于接收、学习和探索，不控制无线电发射。',
      en: 'This route uses China-specific sources. Radio Earth V1 is for receiving, learning and exploration; it does not control a transmitter.',
    },
    licenseSystem: 'CRAC_ABC',
    frequencyPlan: 'CN_AMATEUR_SERVICE',
    regulator: 'MIIT / CRAC',
    callsignSystem: 'CN_AMATEUR_CALLSIGN',
    mapProvider: 'china',
  },
  us: {
    country: 'US',
    label: { zh: '美国', en: 'United States' },
    notice: {
      zh: '学习内容采用美国市场与官方来源。界面语言不会改变适用的 FCC 执照体系。',
      en: 'This route uses US-specific official sources. Interface language does not change the FCC licensing system that applies.',
    },
    licenseSystem: 'FCC_TGE',
    frequencyPlan: 'US_AMATEUR_BAND_PLAN',
    regulator: 'FCC',
    callsignSystem: 'FCC_AMATEUR_CALLSIGN',
    mapProvider: 'global',
  },
};
