/**
 * Typed application-facing view of the static radio SEO route manifest.
 * The build scripts consume the same source manifest from scripts/radio-routes.mjs.
 */
import { radioRoutes } from '../../scripts/radio-routes.mjs';

export type RadioLocale = 'zh-CN' | 'en-US';
export type RadioMarket = 'CN' | 'US' | 'GLOBAL';
export type RadioStructuredDataType = 'Article' | 'WebApplication';

export interface RadioSeoRoute {
  path: string;
  locale: RadioLocale;
  market: RadioMarket;
  title: string;
  description: string;
  canonical: string;
  alternates: Readonly<Partial<Record<RadioLocale, string>>>;
  lastReviewed: string;
  structuredDataType: RadioStructuredDataType;
  h1: string;
  quickAnswer: string;
  requirements: readonly string[];
  steps: readonly string[];
  sections: readonly {
    heading: string;
    paragraphs?: readonly string[];
    items?: readonly string[];
  }[];
  cta: string;
  ctaHref: string;
  faq: readonly { question: string; answer: string }[];
  officialSources: readonly { label: string; url: string }[];
}

export const typedRadioRoutes = radioRoutes as readonly RadioSeoRoute[];
