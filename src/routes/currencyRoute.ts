import express from "express";
import currencyController from "../controller/currencyController";
import authCheck from "../middleware/auth";

const currencyRoute = express.Router();

currencyRoute.get(
  "/convert",
  authCheck,
  currencyController.convertCurrencyRate as any
);
currencyRoute.get("/reverse", authCheck, currencyController.reversePair as any);
currencyRoute.get(
  "/historical",
  authCheck,
  currencyController.getHistoricalData as any
);
currencyRoute.post(
  "/favorites",
  authCheck,
  currencyController.saveFavorite as any
);
currencyRoute.get(
  "/favorites",
  authCheck,
  currencyController.getFavorite as any
);

currencyRoute.post("/alerts", authCheck, currencyController.setAlerts as any);
currencyRoute.get(
  "/start-monitoring",
  authCheck,
  currencyController.startMonitoring as any
);
export default currencyRoute;
