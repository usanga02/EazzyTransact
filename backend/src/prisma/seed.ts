import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  //   await prisma.swapTransaction.deleteMany();
  //   await prisma.wallet.deleteMany();
  //   await prisma.user.deleteMany();
  //   await prisma.exchangeRate.deleteMany();

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      email: "alice@example.com",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "bob@example.com",
    },
  });

  // Create Wallets for each user (NGN and USD)
  await prisma.wallet.createMany({
    data: [
      {
        userId: user1.id,
        currency: "NGN",
        balance: 500000,
      },
      {
        userId: user1.id,
        currency: "USD",
        balance: 1000,
      },
      {
        userId: user2.id,
        currency: "NGN",
        balance: 250000,
      },
      {
        userId: user2.id,
        currency: "USD",
        balance: 500,
      },
    ],
  });

  // Create a valid Exchange Rate with 30 seconds expiry
  await prisma.exchangeRate.create({
    data: {
      fromCurrency: "NGN",
      toCurrency: "USD",
      rate: 0.0012,
      spread: 0.0125,
      validUntil: new Date(Date.now() + 30_000), // 30 seconds validity
    },
  });

  // Reverse Exchange Rate
  await prisma.exchangeRate.create({
    data: {
      fromCurrency: "USD",
      toCurrency: "NGN",
      rate: 833.33,
      spread: 0.0125,
      validUntil: new Date(Date.now() + 30_000),
    },
  });

  console.log("✅ Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
