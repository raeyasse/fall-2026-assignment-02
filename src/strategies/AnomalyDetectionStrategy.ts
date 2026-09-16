import { Transaction } from '../models.js';
import { AnomalyRulesService } from '../services/AnomalyRulesService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class AnomalyDetectionStrategy implements AuditStrategy {
  public readonly name = 'Anomaly & Duplicate Auditor';
  public readonly description =
    'Detects transactions exceeding thresholds and duplicate records';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 2 - Implement this strategy.

    // 1. Call AnomalyRulesService.getRules() asynchronously.
    const rules = await AnomalyRulesService.getRules();
    // 2. Scan transactions to find outliers (expenses exceeding rules.maxTransactionAmount).
    const outliers = transactions.filter(
      (t) => t.amount < 0 && Math.abs(t.amount) > rules.maxTransactionAmount,
    );
    // 3. Scan to identify duplicates (transactions sharing the exact same date, category, description, and amount).
    const groups = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const key = `${t.date}|${t.category}|${t.description}|${t.amount}`;
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }
    const duplicateSets = [...groups.values()].filter((g) => g.length > 1);
    // 4. Identify transactions having a status that matches any in rules.flaggedStatuses.
    const statusFlagged = transactions.filter((t) =>
      rules.flaggedStatuses.includes(t.status),
    );
    // 5. Calculate total flagged value and anomaly rates.
    const anomalousIds = new Set([
      ...outliers.map((t) => t.id),
      ...duplicateSets.flat().map((t) => t.id),
      ...statusFlagged.map((t) => t.id),
    ]);
    const totalFlaggedValue = [
      ...outliers,
      ...duplicateSets.flat(),
      ...statusFlagged,
    ]
      .filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const anomalyRate = transactions.length
      ? (anomalousIds.size / transactions.length) * 100
      : 0;
    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    return [
      'ANOMALY & DUPLICATE AUDIT REPORT',
      '',
      `Outliers (> $${rules.maxTransactionAmount.toFixed(2)}): ${outliers.length}`,
      ...outliers.map(
        (t) =>
          `  - ${t.id} ${t.date} ${t.description}: $${Math.abs(t.amount).toFixed(2)}`,
      ),
      '',
      `Duplicate sets: ${duplicateSets.length}`,
      ...duplicateSets.flatMap((g, i) => [
        `  Set ${i + 1} (${g.length} copies): ${g[0].description} $${Math.abs(g[0].amount).toFixed(2)}`,
        ...g.map((t) => `    - ${t.id} ${t.date}`),
      ]),
      '',
      `Status-flagged: ${statusFlagged.length}`,
      ...statusFlagged.map((t) => `  - ${t.id} ${t.description} [${t.status}]`),
      '',
      `Total anomalous: ${anomalousIds.size} of ${transactions.length} (${anomalyRate.toFixed(1)}%)`,
      `Total flagged value: $${totalFlaggedValue.toFixed(2)}`,
    ].join('\n');

    throw new Error('Method not implemented.');
  }
}
