import express from "express";
import { CurrencyExchangeService } from "../services/currencyExchangeService";

const router = express.Router();
const service = new CurrencyExchangeService();

router.get("/rate", async (req, res) => {
  const { from, to } = req.query;
  try {
    const rate = await service.getExchangeRate(from as string, to as string);
    res.json(rate);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/swap", async (req, res) => {
  const { email, fromWalletId, toWalletId, amount } = req.body;
  try {
    const result = await service.executeSwap(
      email,
      fromWalletId,
      toWalletId,
      amount
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/history/:userId", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await service.getUserSwapHistory(
      req.params.userId,
      +page,
      +limit
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
