import express from "express";
import dotenv from "dotenv";
import exchangeRoutes from "./src/routes/exchange";
import cors from "cors";
import { env } from "./utils/env";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/exchange", exchangeRoutes);

const PORT = env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Currency exchange service running on port ${PORT}`);
});
