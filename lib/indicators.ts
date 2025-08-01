import { RSI, MACD, SMA } from 'technicalindicators';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// --- THIS IS THE FIX ---
// The properties of the macd object are now allowed to be undefined.
export interface EnrichedCandle extends Candle {
  rsi?: number;
  macd?: {
    MACD?: number;
    signal?: number;
    histogram?: number;
  };
  sma20?: number;
  sma50?: number;
}

export function calculateIndicators(data: Candle[]): EnrichedCandle[] {
  const chronologicalData = [...data].reverse();
  const closingPrices = chronologicalData.map(d => d.close);

  const rsiResult = RSI.calculate({ values: closingPrices, period: 14 });
  const macdResult = MACD.calculate({
    values: closingPrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const sma20Result = SMA.calculate({ values: closingPrices, period: 20 });
  const sma50Result = SMA.calculate({ values: closingPrices, period: 50 });

  const enrichedData: EnrichedCandle[] = chronologicalData.map((candle, index) => {
    const rsiOffset = index - 14;
    const macdOffset = index - 25;
    const sma20Offset = index - 19;
    const sma50Offset = index - 49;

    return {
      ...candle,
      rsi: rsiOffset >= 0 ? rsiResult[rsiOffset] : undefined,
      macd: macdOffset >= 0 ? macdResult[macdOffset] : undefined,
      sma20: sma20Offset >= 0 ? sma20Result[sma20Offset] : undefined,
      sma50: sma50Offset >= 0 ? sma50Result[sma50Offset] : undefined,
    };
  });

  return enrichedData;
}