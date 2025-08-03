import { RSI, MACD, SMA, EMA, BollingerBands } from 'technicalindicators';

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
    MACD?: number;
    signal?: number;
    histogram?: number;
  };
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  bb?: {
    upper: number;
    middle: number;
    lower: number;
  };
}

// This function takes the raw historical data and enriches it with indicators
export function calculateIndicators(data: Candle[]): EnrichedCandle[] {
  // We need to reverse the data because FMP provides it in reverse chronological order
  const chronologicalData = [...data].reverse();
  const closingPrices = chronologicalData.map(d => d.close);

  // --- Calculate Indicators ---
  const rsiResult = RSI.calculate({ values: closingPrices, period: 14 });
  const macdResult = MACD.calculate({ values: closingPrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
  const sma20Result = SMA.calculate({ values: closingPrices, period: 20 });
  const sma50Result = SMA.calculate({ values: closingPrices, period: 50 });
  const ema12Result = EMA.calculate({ values: closingPrices, period: 12 });
  const ema26Result = EMA.calculate({ values: closingPrices, period: 26 });
  const bbResult = BollingerBands.calculate({ values: closingPrices, period: 20, stdDev: 2 });

  // --- Enrich the Data ---
  const enrichedData: EnrichedCandle[] = chronologicalData.map((candle, index) => {
    // Calculate offsets to align indicator data with candle data
    const rsiOffset = index - 14;
    const macdOffset = index - 25;
    const sma20Offset = index - 19;
    const sma50Offset = index - 49;
    const ema12Offset = index - 11;
    const ema26Offset = index - 25;
    const bbOffset = index - 19;

    return {
      ...candle,
      rsi: rsiOffset >= 0 ? rsiResult[rsiOffset] : undefined,
      macd: macdOffset >= 0 ? macdResult[macdOffset] : undefined,
      sma20: sma20Offset >= 0 ? sma20Result[sma20Offset] : undefined,
      sma50: sma50Offset >= 0 ? sma50Result[sma50Offset] : undefined,
      ema12: ema12Offset >= 0 ? ema12Result[ema12Offset] : undefined,
      ema26: ema26Offset >= 0 ? ema26Result[ema26Offset] : undefined,
      bb: bbOffset >= 0 ? bbResult[bbOffset] : undefined,
    };
  });

  return enrichedData;
}
