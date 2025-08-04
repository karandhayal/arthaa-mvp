import { type EnrichedCandle } from './indicatorManager';
import { type Rule, type RuleGroup } from '../app/components/types';

interface Trade {
  type: 'buy' | 'sell';
  price: number;
  date: string;
  size: number;
  symbol: string; // Added symbol to the trade object
  reason?: string;
  pnl?: number;
  pnl_percent?: number;
}

export interface BacktestResult {
  trades: Trade[];
  finalPortfolio: number;
  performance: number;
  winRate: number;
  totalTrades: number;
}

export function runBacktest(
  enrichedData: EnrichedCandle[],
  strategyConfig: { entryLogic: RuleGroup, exitLogic: RuleGroup, stopLoss?: number, targetProfit?: number, trailingStopLoss?: number },
  initialPortfolio: number,
  symbol: string // Symbol is now a required parameter
): BacktestResult {
  let portfolio = initialPortfolio;
  let position: Trade | null = null;
  const trades: Trade[] = [];
  let wins = 0;
  let peakPortfolio = initialPortfolio;

  const { entryLogic, exitLogic, stopLoss, targetProfit, trailingStopLoss } = strategyConfig;

  // Helper functions for getting indicator keys and values
  const getIndicatorKey = (indicator: string, p1?: number, p2?: number): string => {
    if (!indicator) return '';
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

  const getIndicatorValue = (candle: EnrichedCandle, indicator: string, p1?: number, p2?: number, subIndicator?: string) => {
      const key = getIndicatorKey(indicator, p1, p2);
      const indicatorData = candle.indicators[key];
      if (typeof indicatorData === 'object' && subIndicator) {
          return (indicatorData as any)[subIndicator];
      }
      return indicatorData as number;
  };
  
  const evaluateGroup = (group: RuleGroup, candle: EnrichedCandle, prevCandle: EnrichedCandle): { met: boolean; reasons: string[] } => {
    if (!group || !Array.isArray(group.rules)) return { met: false, reasons: [] };
    const reasonResults: string[] = [];
    for (const item of group.rules) {
        let itemMet = false;
        let itemReason = '';
        if ('logic' in item) {
            const subGroupResult = evaluateGroup(item as RuleGroup, candle, prevCandle);
            if (subGroupResult.met) {
                itemMet = true;
                itemReason = `(${subGroupResult.reasons.join(` ${item.logic} `)})`;
            }
        } else {
            const reason = checkCondition(item as Rule, candle, prevCandle);
            if (reason) {
                itemMet = true;
                itemReason = reason;
            }
        }
        if (itemMet) {
            reasonResults.push(itemReason);
            if (group.logic === 'OR') return { met: true, reasons: reasonResults };
        } else {
            if (group.logic === 'AND') return { met: false, reasons: [] };
        }
    }
    return { met: reasonResults.length > 0, reasons: reasonResults };
  };

  const checkCondition = (rule: Rule, candle: EnrichedCandle, prevCandle: EnrichedCandle): string | null => {
    const { indicator, condition, period1, period2, value_type, value_number, value_indicator, value_period1 } = rule;
    if (!indicator || !condition) return null;

    let currentVal: number | undefined;
    let prevVal: number | undefined;
    let targetVal: number | undefined;
    let prevTargetVal: number | undefined;

    if (indicator === 'MACD') {
        currentVal = getIndicatorValue(candle, indicator, period1, period2, 'MACD');
        prevVal = getIndicatorValue(prevCandle, indicator, period1, period2, 'MACD');
        targetVal = getIndicatorValue(candle, indicator, period1, period2, 'signal');
        prevTargetVal = getIndicatorValue(prevCandle, indicator, period1, period2, 'signal');
    } else {
        currentVal = getIndicatorValue(candle, indicator, period1, period2);
        prevVal = getIndicatorValue(prevCandle, indicator, period1, period2);
    }

    if (value_type === 'number') {
        targetVal = value_number;
    } else if (value_type === 'indicator') {
        targetVal = getIndicatorValue(candle, indicator, value_period1);
        prevTargetVal = getIndicatorValue(prevCandle, indicator, value_period1);
    } else if (value_type === 'static') {
        if (value_indicator === 'Price') {
            targetVal = candle.close;
            prevTargetVal = prevCandle.close;
        } else if (value_indicator === 'Upper Band') {
            targetVal = getIndicatorValue(candle, indicator, period1, period2, 'upper');
            prevTargetVal = getIndicatorValue(prevCandle, indicator, period1, period2, 'upper');
        } else if (value_indicator === 'Lower Band') {
            targetVal = getIndicatorValue(candle, indicator, period1, period2, 'lower');
            prevTargetVal = getIndicatorValue(prevCandle, indicator, period1, period2, 'lower');
        }
    }

    if (currentVal === undefined || prevVal === undefined || targetVal === undefined) return null;

    const offset = rule.offset_value || 0;
    const offsetMultiplier = rule.offset_type === 'percentage' ? 1 + (offset / 100) : 1;
    const offsetValue = rule.offset_type === 'value' ? offset : 0;

    if (condition === 'Is Above' && currentVal > targetVal) return formatRule(rule);
    if (condition === 'Is Below' && currentVal < targetVal) return formatRule(rule);
    if (condition === 'Crosses Above' && prevVal <= (prevTargetVal ?? targetVal) && currentVal > (targetVal * offsetMultiplier) + offsetValue) return formatRule(rule);
    if (condition === 'Crosses Below' && prevVal >= (prevTargetVal ?? targetVal) && currentVal < (targetVal * offsetMultiplier) - offsetValue) return formatRule(rule);
    if (condition === 'Crosses Above Signal' && prevVal <= (prevTargetVal ?? targetVal) && currentVal > targetVal) return `${indicator} Crosses Signal`;
    if (condition === 'Crosses Below Signal' && prevVal >= (prevTargetVal ?? targetVal) && currentVal < targetVal) return `${indicator} Crosses Below Signal`;
    if (indicator === 'Candle' && condition === 'Higher High' && candle.high > prevCandle.high) return 'Candle made a Higher High';
    if (indicator === 'Candle' && condition === 'Lower Low' && candle.low < prevCandle.low) return 'Candle made a Lower Low';

    return null;
  };

  const formatRule = (rule: Rule): string => {
    let base = rule.indicator || 'N/A';
    if (rule.period1) base += `(${rule.period1}${rule.period2 ? `, ${rule.period2}` : ''})`;
    let valueStr = rule.value_type === 'number' ? rule.value_number : (rule.value_indicator || '');
    if (rule.value_type === 'indicator') valueStr = `${rule.indicator}(${rule.value_period1})`;
    return `${base} ${rule.condition} ${valueStr}`;
  };

  for (let i = 1; i < enrichedData.length; i++) {
    const candle = enrichedData[i];
    const prevCandle = enrichedData[i - 1];
    if (position) {
      const currentPortfolioValue = portfolio + position.size * candle.close;
      if (currentPortfolioValue > peakPortfolio) peakPortfolio = currentPortfolioValue;
      const pnl_percent = (candle.close - position.price) / position.price;
      const trailingStopPrice = peakPortfolio * (1 - (trailingStopLoss || 0) / 100);
      let exitReason = '';
      if (stopLoss && pnl_percent <= -stopLoss / 100) exitReason = 'Stop Loss Hit';
      else if (targetProfit && pnl_percent >= targetProfit / 100) exitReason = 'Target Profit Hit';
      else if (trailingStopLoss && currentPortfolioValue < trailingStopPrice) exitReason = 'Trailing Stop Loss Hit';
      else {
          const exitResult = evaluateGroup(exitLogic, candle, prevCandle);
          if (exitResult.met) exitReason = exitResult.reasons.join(` ${exitLogic.logic} `);
      }
      if (exitReason) {
        const pnl = (candle.close - position.price) * position.size;
        const exitTrade: Trade = { type: 'sell', price: candle.close, date: candle.date, size: position.size, symbol, reason: exitReason, pnl, pnl_percent: pnl_percent * 100 };
        trades.push(exitTrade);
        portfolio += exitTrade.price * exitTrade.size;
        if (exitTrade.price > position.price) wins++;
        position = null;
        peakPortfolio = portfolio;
      }
    }
    if (!position) {
      const entryResult = evaluateGroup(entryLogic, candle, prevCandle);
      if (entryResult.met) {
        const entryReason = entryResult.reasons.join(` ${entryLogic.logic} `);
        const tradeSize = Math.floor(portfolio / candle.close); 
        if (tradeSize > 0) {
            const entryTrade: Trade = { type: 'buy', price: candle.close, date: candle.date, size: tradeSize, symbol, reason: entryReason };
            trades.push(entryTrade);
            portfolio -= entryTrade.price * entryTrade.size;
            position = entryTrade;
        }
      }
    }
  }

  const finalPortfolio = position ? portfolio + position.size * enrichedData[enrichedData.length - 1].close : portfolio;
  const performance = ((finalPortfolio - initialPortfolio) / initialPortfolio) * 100;
  const totalTrades = trades.filter(t => t.type === 'buy').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return { trades, finalPortfolio, performance, winRate, totalTrades };
}
