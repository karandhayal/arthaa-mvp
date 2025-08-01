import { type EnrichedCandle } from './indicators';

// Define the shape of a single trade and the overall result
interface Trade {
  type: 'buy' | 'sell';
  price: number;
  date: string;
  size: number;
}

export interface BacktestResult {
  trades: Trade[];
  finalPortfolio: number;
  performance: number;
  winRate: number;
  totalTrades: number;
}

// Define the shape of a trading rule and the strategy config
interface TradingRule {
    indicator: string;
    condition: string;
    value: string;
}

interface StrategyConfig {
    entryConditions: TradingRule[];
    exitConditions: TradingRule[];
    stopLoss: number;
    targetProfit: number;
}

// The main backtesting function with proper types
export function runBacktest(
  enrichedData: EnrichedCandle[],
  strategyConfig: StrategyConfig,
  initialPortfolio: number
): BacktestResult {
  let portfolio = initialPortfolio;
  let position: Trade | null = null;
  const trades: Trade[] = [];
  let wins = 0;

  const {
    entryConditions,
    exitConditions,
    stopLoss: stopLossPercent,
    targetProfit: targetProfitPercent,
  } = strategyConfig;

  const checkCondition = (condition: TradingRule, candle: EnrichedCandle, prevCandle?: EnrichedCandle): boolean => {
    if (!candle || !prevCandle) return false;
    const { indicator, condition: logic, value } = condition;
    switch (indicator) {
        case 'RSI': {
            if (!candle.rsi || !prevCandle.rsi) return false;
            const rsiValue = Number(value);
            if (logic === 'Is Below') return candle.rsi < rsiValue;
            if (logic === 'Is Above') return candle.rsi > rsiValue;
            if (logic === 'Crosses Above') return prevCandle.rsi <= rsiValue && candle.rsi > rsiValue;
            if (logic === 'Crosses Below') return prevCandle.rsi >= rsiValue && candle.rsi < rsiValue;
            break;
        }
        case 'MACD': {
            if (!candle.macd?.MACD || !prevCandle.macd?.MACD || !candle.macd.signal || !prevCandle.macd.signal) return false;
            if (logic === 'Is Positive') return candle.macd.MACD > 0;
            if (logic === 'Is Negative') return candle.macd.MACD < 0;
            if (logic === 'Crosses Above Signal') return prevCandle.macd.MACD <= prevCandle.macd.signal && candle.macd.MACD > candle.macd.signal;
            if (logic === 'Crosses Below Signal') return prevCandle.macd.MACD >= prevCandle.macd.signal && candle.macd.MACD < candle.macd.signal;
            break;
        }
        case 'Moving Average': {
            if (!candle.sma20 || !candle.sma50 || !prevCandle.sma20 || !prevCandle.sma50) return false;
            const targetSma = value === 'Moving Average(50)' ? candle.sma50 : candle.sma20;
            const prevTargetSma = value === 'Moving Average(50)' ? prevCandle.sma50 : prevCandle.sma20;
            if (logic === 'Is Above') return candle.close > targetSma;
            if (logic === 'Is Below') return candle.close < targetSma;
            if (logic === 'Crosses Above') return prevCandle.close <= prevTargetSma && candle.close > targetSma;
            if (logic === 'Crosses Below') return prevCandle.close >= prevTargetSma && candle.close < targetSma;
            break;
        }
        case 'Candle': {
            if (logic === 'Higher High') return candle.high > prevCandle.high;
            if (logic === 'Lower Low') return candle.low < prevCandle.low;
            break;
        }
    }
    return false;
  };

  for (let i = 1; i < enrichedData.length; i++) {
    const candle = enrichedData[i];
    const prevCandle = enrichedData[i - 1];
    if (position) {
      const pnl = (candle.close - position.price) / position.price;
      const shouldExit =
        (stopLossPercent && pnl <= -stopLossPercent / 100) ||
        (targetProfitPercent && pnl >= targetProfitPercent / 100) ||
        (exitConditions.length > 0 && exitConditions.every((cond) => checkCondition(cond, candle, prevCandle)));
      if (shouldExit) {
        const exitTrade: Trade = { type: 'sell', price: candle.close, date: candle.date, size: position.size };
        trades.push(exitTrade);
        portfolio += exitTrade.price * exitTrade.size;
        if (exitTrade.price > position.price) wins++;
        position = null;
      }
    }
    if (!position) {
      const shouldEnter = entryConditions.length > 0 && entryConditions.every((cond) => checkCondition(cond, candle, prevCandle));
      if (shouldEnter) {
        const tradeSize = portfolio / candle.close;
        const entryTrade: Trade = { type: 'buy', price: candle.close, date: candle.date, size: tradeSize };
        trades.push(entryTrade);
        portfolio -= entryTrade.price * entryTrade.size;
        position = entryTrade;
      }
    }
  }

  const finalPortfolio = position ? portfolio + position.size * enrichedData[enrichedData.length - 1].close : portfolio;
  const performance = ((finalPortfolio - initialPortfolio) / initialPortfolio) * 100;
  const totalTrades = trades.filter(t => t.type === 'buy').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return { trades, finalPortfolio, performance, winRate, totalTrades };
}