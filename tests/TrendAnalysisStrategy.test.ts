import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendAnalysisStrategy } from '../src/strategies/TrendAnalysisStrategy.js';
import { HistoricalDataService } from '../src/services/HistoricalDataService.js';
import { Transaction } from '../src/models.js';

describe('TrendAnalysisStrategy (Feature 3)', () => {
  let strategy: TrendAnalysisStrategy;

  beforeEach(() => {
    strategy = new TrendAnalysisStrategy();
    vi.restoreAllMocks();
  });

  it('should group current expenses by category and compute accurate totals', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -100,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -150,
        category: 'Food',
        description: 'Restaurant',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: 500,
        category: 'Food',
        description: 'Refund',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('Food');
    expect(result).toContain('$250.00');
  });

  it('should calculate variance percentage from historical averages correctly', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('+25.00%');
  });

  it('should highlight categories exceeding positive/negative 20% variance threshold', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
      Entertainment: 200,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -250,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100,
        category: 'Entertainment',
        description: 'Movies',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('+25.00%');
    expect(result).toContain('-50.00%');
    expect(result).toContain('Significant Growth Categories');
    expect(result).toContain('Significant Savings Categories');
    expect(result).toContain('Food');
    expect(result).toContain('Entertainment');
  });

  it('should handle categories present in current data but missing in historical benchmarks', async () => {
    vi.spyOn(
      HistoricalDataService,
      'getHistoricalAverages',
    ).mockResolvedValue({
      Food: 200,
    });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -300,
        category: 'Travel',
        description: 'Hotel',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(result).toContain('Travel');
    expect(result).toContain('$300.00');
    expect(result).toContain('N/A');
  });

  it('should format historical vs current comparisons in a readable report', async () => {
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Food: 200,
      });

    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -200,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(transactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Historical Trend Audit Report');
    expect(result).toContain('Category');
    expect(result).toContain('Current Spending');
    expect(result).toContain('Historical Average');
    expect(result).toContain('Change');
    expect(result).toContain('Food');
    expect(result).toContain('$200.00');
    expect(result).toContain('0.00%');
  });
});
