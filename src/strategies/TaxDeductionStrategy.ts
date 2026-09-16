import { Transaction } from '../models.js';
import { TaxConfigService } from '../services/TaxConfigService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TaxDeductionStrategy implements AuditStrategy {
  public readonly name = 'Tax & Deductions Auditor';
  public readonly description =
    'Identifies eligible tax-deductible expenses and estimates savings';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 4 - Implement this strategy.
    // 1. Call TaxConfigService.getTaxConfig() asynchronously.
    const taxConfig = await TaxConfigService.getTaxConfig();
    // 2. Filter expenses (amount < 0) that belong to eligible tax-deductible categories.
    const deductibleTransactions = transactions.filter((transaction) => transaction.amount < 0 && taxConfig.deductibleCategories.includes(transaction.category));

    // 3. Sum total deductible expenses.
    const totalDeductions = deductibleTransactions.reduce((total, transaction) => total + Math.abs(transaction.amount),0,);

    // 4. Estimate tax savings based on the standard tax rate: total deductible * taxRate.
    const estimatedTaxSavings = totalDeductions * taxConfig.standardTaxRate;

    // 5. Estimate sales tax/VAT paid on NON-deductible expenses using standard tax rate.
    const nonDeductibleTransactions = transactions.filter((transaction) => transaction.amount < 0 && !taxConfig.deductibleCategories.includes(transaction.category),);

    const totalNonDeductible = nonDeductibleTransactions.reduce((total, transaction) => total + Math.abs(transaction.amount),0,);

    const estimatedVAT = totalNonDeductible * taxConfig.standardTaxRate;

    // 6. Format and return a text-based audit report detailing total deductions, savings, VAT estimates, and eligible transactions.
    const eligibleTransactionList = deductibleTransactions.map((transaction) =>`${transaction.date} | ${transaction.category} | ${transaction.description} | $${Math.abs(transaction.amount).toFixed(2)}`,).join('\n');


    const report = [
      'Tax & Deductions Audit Report',
      '',
      'Eligible Deductible Transactions:',
      eligibleTransactionList || 'None',
      '',
      `Total Deductions: $${totalDeductions.toFixed(2)}`,
      `Estimated Tax Savings: $${estimatedTaxSavings.toFixed(2)}`,
      `Estimated Sales Tax (VAT): $${estimatedVAT.toFixed(2)}`,
    ];

    return report.join('\n');
  }
}
