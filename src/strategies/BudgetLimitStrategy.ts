import { Transaction } from '../models.js';
import { BudgetService } from '../services/BudgetService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class BudgetLimitStrategy implements AuditStrategy {
  public readonly name = 'Budget Limit Auditor';
  public readonly description =
    'Checks category spending against monthly budget limits';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {

    // 1. Call BudgetService.getCategoryBudgets() asynchronously.
    const budgets =await BudgetService.getCategoryBudgets();
    const expenses=transactions.filter((transaction)=>transaction.amount<0,);
    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    const spendingByCategory:Record<string,number>={};
    for(const transaction of expenses){
      const category=transaction.category;
      spendingByCategory[category]=(spendingByCategory[category]??0)+Math.abs(transaction.amount);
    }
    const overBudgetCategories: string[] = [];
    const report:string[]=[];
    // 3. Compare spending against the fetched limits.
    for(const category of Object.keys(spendingByCategory)){
      const spent=spendingByCategory[category];
      const budget=budgets[category];
      report.push(
  `${category}: Budget $${budget.toFixed(2)}, Actual $${spent.toFixed(2)}`,
);
      if(spent>budget)
      {
    // 4. Identify overages (categories where spending exceeds the budget).
        const overage=spent-budget;
        const percentageExceeded=(spent/budget)*100;
        overBudgetCategories.push(category);
        const categoryTransactions=expenses.filter((transaction)=>transaction.category===category,);
        report.push(
        `WARNING: ${category} is over budget by $${overage.toFixed(2)} (${percentageExceeded.toFixed(2)}%)`,
      );
      for (const transaction of categoryTransactions) {
      report.push(
    `  - ${transaction.date}: ${transaction.description} ($${Math.abs(transaction.amount).toFixed(2)})`,
  );
}
      }
    }
    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.
   return report.join('\n');
  }
}
