export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  spread: number;
  validUntil: Date;
}

export interface SwapResult {
  transactionId: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  status: "pending" | "completed" | "failed";
}
