import { RSI, MACD, SMA } from 'technicalindicators';

// Define the shape of a single data candle from the FMP API
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// This is the candle after we've added our indicator data to it
export interface EnrichedCandle extends Candle {
  rsi?: number;
  macd?: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  sma20?: number;
  sma50?: number;
}

// This function takes the raw historical data and enriches it with indicators
export function calculateIndicators(data: Candle[]): EnrichedCandle[] {
  // We need to reverse the data because FMP provides it in reverse chronological order
  const chronologicalData = [...data].reverse();
  const closingPrices = chronologicalData.map(d => d.close);

  // --- Calculate Indicators ---
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

  // --- Enrich the Data ---
  // We map over the original data and add the calculated indicator values.
  // Since indicators need a "warm-up" period, the first few candles won't have values.
  const enrichedData: EnrichedCandle[] = chronologicalData.map((candle, index) => {
    // Find the offset to align indicator data with candle data
    const rsiOffset = index - 14;
    const macdOffset = index - 25; // MACD warmup is slowPeriod - 1
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