import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class CurrencyExchangeService {
  private SPREAD = 0.0125;

  async getExchangeRate(fromCurrency: string, toCurrency: string) {
    const now = new Date();
    const rate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        validUntil: { gte: now },
      },
      orderBy: { validUntil: "desc" },
    });

    if (!rate) throw new Error("No valid exchange rate found");

    return {
      fromCurrency,
      toCurrency,
      rate: rate.rate,
      spread: rate.spread,
      validUntil: rate.validUntil,
    };
  }

  async executeSwap(
    email: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ) {
    return await prisma.$transaction(async (tx: PrismaClient) => {
      const user = await tx.user.findUnique({
        where: { email },
        include: { wallets: true },
      });

      if (!user) throw new Error("User not found");

      const fromWallet = user.wallets.find(
        (w: any) => w.currency === fromCurrency
      );
      const toWallet = user.wallets.find((w: any) => w.currency === toCurrency);

      if (!fromWallet || !toWallet) throw new Error("Wallets not found");
      if (fromWallet.balance < amount) throw new Error("Insufficient funds");

      const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

      const fee = amount * this.SPREAD;
      const convertedAmount = (amount - fee) * exchangeRate.rate;

      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: convertedAmount } },
      });

      const transaction = await tx.swapTransaction.create({
        data: {
          userId: user.id,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          fromAmount: amount,
          toAmount: convertedAmount,
          rate: exchangeRate.rate,
          fee,
          status: "completed",
        },
      });

      return {
        transactionId: transaction.id,
        fromAmount: amount,
        toAmount: convertedAmount,
        rate: exchangeRate.rate,
        fee,
        status: transaction.status as "pending" | "completed" | "failed",
      };
    });
  }

  async getUserSwapHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const transactions = await prisma.swapTransaction.findMany({
      where: { userId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return { page, limit, transactions };
  }
}
