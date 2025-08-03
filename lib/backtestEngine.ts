// In lib/backtestEngine.ts

import { type EnrichedCandle } from './indicators';
import { type Rule, type RuleGroup } from '../app/components/types';

interface Trade {
  type: 'buy' | 'sell';
  price: number;
  date: string;
  size: number;
  reason?: string;
  pnl?: number; // Profit/Loss in dollars
  pnl_percent?: number; // Profit/Loss in percentage
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
  initialPortfolio: number
): BacktestResult {
  let portfolio = initialPortfolio;
  let position: Trade | null = null;
  const trades: Trade[] = [];
  let wins = 0;
  let peakPortfolio = initialPortfolio;

  const { entryLogic, exitLogic, stopLoss, targetProfit, trailingStopLoss } = strategyConfig;

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
    if (!candle || !prevCandle) return null;
    const { indicator, condition, value } = rule;
     switch (indicator) {
      case 'RSI':
        if (!candle.rsi || !prevCandle.rsi) return null;
        if (condition === 'Is Below' && candle.rsi < Number(value)) return `RSI (${candle.rsi.toFixed(2)}) < ${value}`;
        if (condition === 'Is Above' && candle.rsi > Number(value)) return `RSI (${candle.rsi.toFixed(2)}) > ${value}`;
        if (condition === 'Crosses Above' && prevCandle.rsi <= Number(value) && candle.rsi > Number(value)) return `RSI Crosses Above ${value}`;
        if (condition === 'Crosses Below' && prevCandle.rsi >= Number(value) && candle.rsi < Number(value)) return `RSI Crosses Below ${value}`;
        break;
      case 'MACD':
        if (!candle.macd?.MACD || !candle.macd.signal) return null;
        if (condition === 'Is Positive' && candle.macd.MACD > 0) return `MACD is Positive`;
        if (condition === 'Is Negative' && candle.macd.MACD < 0) return `MACD is Negative`;
        if (condition === 'Crosses Above Signal' && prevCandle.macd!.MACD! <= prevCandle.macd!.signal! && candle.macd.MACD > candle.macd.signal) return `MACD Crosses Signal`;
        if (condition === 'Crosses Below Signal' && prevCandle.macd!.MACD! >= prevCandle.macd!.signal! && candle.macd.MACD < candle.macd.signal) return `MACD Crosses Below Signal`;
        break;
      case 'Bollinger Bands':
          if(!candle.bb || !prevCandle.bb) return null;
          if(condition === 'Price is Above' && candle.close > candle.bb.upper) return `Price > Upper Band`;
          if(condition === 'Price is Below' && candle.close < candle.bb.lower) return `Price < Lower Band`;
          if(condition === 'Price Crosses Above' && prevCandle.close <= prevCandle.bb.upper && candle.close > candle.bb.upper) return `Price Crosses Upper Band`;
          if(condition === 'Price Crosses Below' && prevCandle.close >= prevCandle.bb.lower && candle.close < candle.bb.lower) return `Price Crosses Lower Band`;
          break;
    }
    return null;
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
        const exitTrade: Trade = { 
            type: 'sell', 
            price: candle.close, 
            date: candle.date, 
            size: position.size, 
            reason: exitReason,
            pnl: pnl,
            pnl_percent: pnl_percent * 100
        };
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
        // --- THIS IS THE FIX ---
        // Calculate the number of whole shares that can be bought
        const tradeSize = Math.floor(portfolio / candle.close); 
        
        if (tradeSize > 0) {
            const entryTrade: Trade = { type: 'buy', price: candle.close, date: candle.date, size: tradeSize, reason: entryReason };
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
