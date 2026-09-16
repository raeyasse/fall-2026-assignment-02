import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetLimitStrategy } from '../src/strategies/BudgetLimitStrategy.js';
import { BudgetService } from '../src/services/BudgetService.js';
import { Transaction } from '../src/models.js';

describe('BudgetLimitStrategy (Feature 1)', () => {
  let strategy: BudgetLimitStrategy;

  beforeEach(() => {
    strategy = new BudgetLimitStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should correctly identify categories that are over budget', async () => {
  //   // 1. Mock the BudgetService asynchronously
  //   const mockBudgets = { Food: 100, Rent: 1000 };
  //   const spy = vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);
  //
  //   // 2. Set up test transactions
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -150.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Over budget
  //     { id: '2', date: '2026-05-02', amount: -900.00, category: 'Rent', description: 'Apartment', status: 'completed' }, // Under budget
  //   ];
  //
  //   // 3. Execute
  //   const result = await strategy.execute(testTransactions);
  //
  //   // 4. Assert
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Food');
  //   expect(result).toContain('OVER BUDGET'); // or whatever formatting you choose
  //   expect(result).not.toContain('Rent over budget');
  // });

  it('should group expenses correctly by category and sum them',async()=>{
    const mockBudgets={Food:100,Rent:1000};
    const spy=vi
    .spyOn(BudgetService,'getCategoryBudgets')
    .mockResolvedValue(mockBudgets);
    // Create test transactions with two Food expenses and one Rent expense.
const testTransactions: Transaction[] = [
  {
    id: '1',
    date: '2026-05-01',
    amount: -50,
    category: 'Food',
    description: 'Groceries',
    status: 'completed',
  },
  {
    id: '2',
    date: '2026-05-02',
    amount: -75,
    category: 'Food',
    description: 'More groceries',
    status: 'completed',
  },
  {
    id: '3',
    date: '2026-05-03',
    amount: -900,
    category: 'Rent',
    description: 'Apartment',
    status: 'completed',
  },
];
// Check the fake budgets used by this test.
  const result=await strategy.execute(testTransactions);
  console.log(result);
  expect(spy).toHaveBeenCalled();
  expect(result).toContain('Food: Budget $100.00, Actual $125.00');



  });
  it('should calculate absolute overage amounts and percentage exceeded', async () => {
    const mockBudgets = { Food: 100 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -90,
        category: 'Food',
        description: 'Weekly shop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -60,
        category: 'Food',
        description: 'Snacks',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    // Spent $150 against a $100 budget: overage $50, exceeded 150%
    expect(result).toContain('over budget by $50.00');
    expect(result).toContain('150.00%');
  });

  it('should list the specific transactions contributing to categories that are over budget', async () => {
    const mockBudgets = { Food: 100, Rent: 1000 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -90,
        category: 'Food',
        description: 'Weekly shop',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -60,
        category: 'Food',
        description: 'Snacks',
        status: 'completed',
      },
      {
        id: '3',
        date: '2026-05-03',
        amount: -900,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Weekly shop');
    expect(result).toContain('$90.00');
    expect(result).toContain('Snacks');
    // Rent is under budget, so its transaction should not be itemized
    expect(result).not.toContain('Apartment');
  });

  it('should handle scenarios where no categories are over budget', async () => {
    const mockBudgets = { Food: 500, Rent: 1000 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2026-05-01',
        amount: -120,
        category: 'Food',
        description: 'Groceries',
        status: 'completed',
      },
      {
        id: '2',
        date: '2026-05-02',
        amount: -900,
        category: 'Rent',
        description: 'Apartment',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Food: Budget $500.00, Actual $120.00');
    expect(result).toContain('Rent: Budget $1000.00, Actual $900.00');
    expect(result).not.toContain('WARNING');
  });

  it('should handle empty transaction list gracefully', async () => {
    const mockBudgets = { Food: 100, Rent: 1000 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const result = await strategy.execute([]);

    expect(typeof result).toBe('string');
    expect(result).not.toContain('WARNING');
  });
});
