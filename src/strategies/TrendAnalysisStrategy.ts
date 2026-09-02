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

    // Group current expenses by category
    for (const transaction of transactions) {
      if (transaction.amount < 0) {
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);

        if (currentTotals[category] === undefined) {
          currentTotals[category] = 0;
        }

        currentTotals[category] += amount;
      }
    }

    const growthCategories: string[] = [];
    const savingsCategories: string[] = [];

    let report = 'Historical Trend Audit Report\n\n';
    report += 'Category | Current Spending | Historical Average | Change\n';
    report += '------------------------------------------------------------\n';

    // Compare current spending to historical averages
    for (const [category, historical] of Object.entries(
      historicalAverages,
    )) {
      const current = currentTotals[category] ?? 0;

      let variance = 0;

      if (historical !== 0) {
        variance = ((current - historical) / historical) * 100;
      }

      report += `${category} | $${current.toFixed(2)} | $${historical.toFixed(
        2,
      )} | ${variance.toFixed(2)}%\n`;

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
