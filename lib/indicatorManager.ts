import { RSI, MACD, SMA, EMA, BollingerBands } from 'technicalindicators';
import { type Rule, type RuleGroup } from '../app/components/types';

// The shape of a single data candle from the API
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// The candle after we've added our custom indicator data to it.
export interface EnrichedCandle extends Candle {
  indicators: { [key: string]: number | object };
}

// Generates a unique key for an indicator based on its parameters.
const getIndicatorKey = (indicator: string, p1?: number, p2?: number): string => {
  switch (indicator) {
    case 'RSI':
    case 'Moving Average':
    case 'EMA':
    case 'Bollinger Bands':
      return `${indicator}_${p1}`;
    case 'MACD':
      return `${indicator}_${p1}_${p2}`;
    default:
      return indicator;
  }
};

// This is the main function that prepares the data for the backtester.
export function enrichCandlesWithIndicators(data: Candle[], strategy: { config: { entryLogic: RuleGroup, exitLogic: RuleGroup } }): EnrichedCandle[] {
  const chronologicalData = [...data].reverse();
  const closingPrices = chronologicalData.map(d => d.close);
  
  const requiredIndicators = new Map<string, { indicator: string, p1?: number, p2?: number }>();

  // Recursively find all unique indicators needed for the strategy
  function findRequiredIndicators(group: RuleGroup) {
    for (const item of group.rules) {
      if ('indicator' in item) { // It's a Rule
        const rule = item as Rule;
        if (rule.indicator) {
          requiredIndicators.set(getIndicatorKey(rule.indicator, rule.period1, rule.period2), { indicator: rule.indicator, p1: rule.period1, p2: rule.period2 });
          
          // --- THIS IS THE FIX ---
          // If the value is another indicator, add it to the list of required indicators.
          if (rule.value_type === 'indicator') {
             requiredIndicators.set(getIndicatorKey(rule.indicator, rule.value_period1), { indicator: rule.indicator, p1: rule.value_period1 });
          }
        }
      } else { // It's a nested RuleGroup
        findRequiredIndicators(item as RuleGroup);
      }
    }
  }

  findRequiredIndicators(strategy.config.entryLogic);
  findRequiredIndicators(strategy.config.exitLogic);

  const calculatedIndicators: { [key: string]: (number | object)[] } = {};

  // Calculate each unique indicator
  requiredIndicators.forEach((params, key) => {
    switch (params.indicator) {
      case 'RSI':
        calculatedIndicators[key] = RSI.calculate({ values: closingPrices, period: params.p1 || 14 });
        break;
      case 'MACD':
        calculatedIndicators[key] = MACD.calculate({ values: closingPrices, fastPeriod: params.p1 || 12, slowPeriod: params.p2 || 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
        break;
      case 'Moving Average':
        calculatedIndicators[key] = SMA.calculate({ values: closingPrices, period: params.p1 || 20 });
        break;
      case 'EMA':
        calculatedIndicators[key] = EMA.calculate({ values: closingPrices, period: params.p1 || 12 });
        break;
      case 'Bollinger Bands':
        calculatedIndicators[key] = BollingerBands.calculate({ values: closingPrices, period: params.p1 || 20, stdDev: 2 });
        break;
    }
  });

  // Enrich each candle with the calculated indicator values
  const enrichedData: EnrichedCandle[] = chronologicalData.map((candle, index) => {
    const indicators: { [key: string]: number | object } = {};
    
    requiredIndicators.forEach((params, key) => {
        const period = params.p1 || 0;
        const warmup = (params.indicator === 'MACD' ? (params.p2 || 26) -1 : period -1);
        const offsetIndex = index - warmup;
        if(offsetIndex >= 0 && calculatedIndicators[key]) {
            indicators[key] = calculatedIndicators[key][offsetIndex];
        }
    });

    return { ...candle, indicators };
  });

  return enrichedData;
}
