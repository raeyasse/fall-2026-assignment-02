import { Transaction } from '../models.js';
import { HistoricalDataService } from '../services/HistoricalDataService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TrendAnalysisStrategy implements AuditStrategy {
  public readonly name = 'Historical Trend Auditor';
  public readonly description =
    'Compares current monthly category spending against historical averages';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    const historicalAverages =
      await HistoricalDataService.getHistoricalAverages();

    const currentTotals: Record<string, number> = {};

    // Group all expenses by category.
    for (const transaction of transactions) {
      if (transaction.amount < 0) {
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);

        currentTotals[category] =
          (currentTotals[category] ?? 0) + amount;
      }
    }

    const growthCategories: string[] = [];
    const savingsCategories: string[] = [];

    let report = 'Historical Trend Audit Report\n\n';
    report +=
      'Category | Current Spending | Historical Average | Change\n';
    report +=
      '------------------------------------------------------------\n';

    // Include categories from both current data and historical data.
    const categories = new Set([
      ...Object.keys(historicalAverages),
      ...Object.keys(currentTotals),
    ]);

    for (const category of categories) {
      const current = currentTotals[category] ?? 0;
      const historical = historicalAverages[category];

      // Handle a category with no historical benchmark.
      if (historical === undefined) {
        report +=
          `${category} | $${current.toFixed(2)} | N/A | N/A\n`;
        continue;
      }

      let variance = 0;

      if (historical !== 0) {
        variance = ((current - historical) / historical) * 100;
      }

      const formattedVariance =
        variance > 0
          ? `+${variance.toFixed(2)}%`
          : `${variance.toFixed(2)}%`;

      report +=
        `${category} | $${current.toFixed(2)} | ` +
        `$${historical.toFixed(2)} | ${formattedVariance}\n`;

      if (variance > 20) {
        growthCategories.push(category);
      } else if (variance < -20) {
        savingsCategories.push(category);
      }
    }

    report += '\nSignificant Growth Categories\n';

    if (growthCategories.length === 0) {
      report += 'None\n';
    } else {
      for (const category of growthCategories) {
        report += `${category}\n`;
      }
    }

    report += '\nSignificant Savings Categories\n';

    if (savingsCategories.length === 0) {
      report += 'None\n';
    } else {
      for (const category of savingsCategories) {
        report += `${category}\n`;
      }
    }

    return report;
  }
}
