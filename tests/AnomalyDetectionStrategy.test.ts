import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionStrategy } from '../src/strategies/AnomalyDetectionStrategy.js';
import { AnomalyRulesService } from '../src/services/AnomalyRulesService.js';
import { Transaction } from '../src/models.js';

describe('AnomalyDetectionStrategy (Feature 2)', () => {
  let strategy: AnomalyDetectionStrategy;

  beforeEach(() => {
    strategy = new AnomalyDetectionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should detect outlier transactions exceeding threshold', async () => {
  //   const mockRules = { maxTransactionAmount: 500.00, flaggedStatuses: ['flagged'] };
  //   const spy = vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue(mockRules);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -600.00, category: 'Shopping', description: 'Laptop', status: 'completed' }, // Outlier
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Normal
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Laptop');
  //   expect(result).toContain('Outlier');
  // });

  it('should detect outlier transactions exceeding the configured max amount limit', async () => {
    const spy = vi
      .spyOn(AnomalyRulesService, 'getRules')
      .mockResolvedValue({
        maxTransactionAmount: 500,
        flaggedStatuses: ['flagged'],
      });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -600,
        category: 'Shopping',
        description: 'Laptop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -100,
        category: 'Food',
        description: 'Grocery',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: 2000,
        category: 'Salary',
        description: 'Paycheck',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Laptop');
    expect(result).not.toContain('Grocery');
    expect(result).not.toContain('Paycheck');
  });

  it('should identify duplicate transactions sharing identical date, amount, category, and description', async () => {
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue({
      maxTransactionAmount: 1000,
      flaggedStatuses: ['flagged'],
    });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-20',
        amount: -60,
        category: 'Food',
        description: 'Diner',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-20',
        amount: -60,
        category: 'Food',
        description: 'Diner',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-21',
        amount: -60,
        category: 'Food',
        description: 'Diner',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Duplicate sets: 1');
  });

  it('should flag transactions matching standard flagged statuses in the rules', async () => {
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue({
      maxTransactionAmount: 1000,
      flaggedStatuses: ['flagged', 'pending'],
    });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -50,
        category: 'Food',
        description: 'Suspicious charge',
        status: 'flagged',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -50,
        category: 'Food',
        description: 'Awaiting clear',
        status: 'pending',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -50,
        category: 'Food',
        description: 'Normal charge',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Status-flagged: 2');
    expect(result).not.toContain('Normal charge');
  });

  it('should calculate correct transaction anomaly rates and total flagged valuation', async () => {
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue({
      maxTransactionAmount: 1000,
      flaggedStatuses: ['flagged'],
    });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -1500,
        category: 'Shopping',
        description: 'Laptop',
        status: 'flagged',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -50,
        category: 'Food',
        description: 'Lunch',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -50,
        category: 'Food',
        description: 'Snack',
        status: 'completed',
      },
      {
        id: '4',
        date: '2026-05-04',
        amount: -50,
        category: 'Food',
        description: 'Coffee',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('1 of 4 (25.0%)');
    expect(result).toContain('$1500.00');
  });

  it('should output a clean, readable text audit report detailing warnings', async () => {
    vi.spyOn(AnomalyRulesService, 'getRules').mockResolvedValue({
      maxTransactionAmount: 1000,
      flaggedStatuses: ['flagged'],
    });

    const result = await strategy.execute([]);

    expect(result).toContain('ANOMALY & DUPLICATE AUDIT REPORT');
    expect(result).toContain('Outliers');
    expect(result).toContain('Duplicate sets: 0');
    expect(result).toContain('0 of 0 (0.0%)');
    expect(result).not.toContain('NaN');
  });
});
