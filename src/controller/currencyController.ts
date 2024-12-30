import { Response, Request } from "express";
import { CustomRequest } from "../middleware/auth";
import ProfileData from "../models/Profile";
import User from "../models/User";
import nodemailer from "nodemailer";
import cron from "node-cron";

type alertPairType = {
  from: string;
  to: string;
  target: number;
};

type pairType = { from: string; to: string };
type savedConversationsType = Array<pairType>;
async function currencyApiCall(from: any, to: any) {
  try {
    const data = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`
    );
    return data;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error;
  }
}
async function sendAlerts(alertPair: alertPairType, email: string) {
  const { from, to, target } = alertPair;

  const currencyData = await currencyApiCall(from, to);
  const data = await currencyData.json();
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.HOST_USER,
      pass: process.env.HOST_PASS,
    },
  });
  const mailOption = {
    from: "Gurpreet",
    to: email,
    subject: `Currency Alert: ${from} to ${to}`,
    text: `The exchange rate of ${from} to ${to} has reached ${target}.`,
  };

  if (data.rates[to] >= target) {
    try {
      await transport.sendMail(mailOption);
      console.log("Alert emails sent successfully.");
    } catch (error) {
      console.error("Error sending alert emails:", error);
    }
  }
}

async function sendDailyUpdates(
  savedConversations: savedConversationsType,
  email: string
) {
  try {
    const rateString: string[] = await Promise.all(
      savedConversations.map(async (savedPair: pairType): Promise<string> => {
        const currencyData = await currencyApiCall(
          savedPair.from,
          savedPair.to
        );
        const data = await currencyData.json();
        console.log(data);
        return `${savedPair.from} to ${savedPair.to} : ${
          data.rates[savedPair.to]
        }` as string;
      })
    );
    const updateMessage = `Today's Exchange Rates:\n` + rateString.join("\n");

    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.HOST_USER,
        pass: process.env.HOST_PASS,
      },
    });
    const mailOptions = {
      from: "gurpreet",
      to: email,
      subject: "Daily Exchange Rate Update",
      text: updateMessage,
    };

    await transport.sendMail(mailOptions);
    console.log("Daily update email sent successfully.");
  } catch (error) {
    console.error("Error sending daily update email:", error);
  }
}

async function convertCurrencyRate(req: Request, res: Response) {
  const { from, to, amt } = req.body;
  const userId = (req as CustomRequest)._id;
  try {
    const currencyData = await currencyApiCall(from, to);

    const data = await currencyData.json();
    const userProfile = await ProfileData.findOne({ userId });

    if (!userProfile) {
      return res.status(403).send("Error");
    }
    userProfile.frequentUsed = { from, to, amount: amt };
    await userProfile.save();
    res.status(200).json({
      ...data,
      amount: amt as number,
      convertAmount: amt * data.rates[to].toFixed(4),
    });
  } catch (error) {
    res.status(403).send("error in converting");
  }
}

async function reversePair(req: Request, res: Response) {
  const { from, to, amt } = req.body;
  const userId = (req as CustomRequest)._id;
  try {
    const currencyData = await currencyApiCall(to, from);

    const data = await currencyData.json();
    const userProfile = await ProfileData.findOne({ userId });

    if (!userProfile) {
      return res.status(403).send("Error");
    }
    userProfile.frequentUsed = { from: to, to: from, amount: amt };
    await userProfile.save();
    res.status(200).json({
      ...data,
      amount: amt as number,
      convertAmount: amt * data.rates[from].toFixed(4),
    });
  } catch (error) {
    res.status(403).send("error in reversing");
  }
}

async function getHistoricalData(req: Request, res: Response) {
  const { from, to, startDate, endDate } = req.body;
  try {
    const apiData = await fetch(
      `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=${from}&symbols=${to}`
    );

    const data = await apiData.json();
    res.status(200).json({ ...data });
  } catch (err) {
    res.status(403).send("Error");
  }
}

async function saveFavorite(req: Request, res: Response) {
  const { from, to } = req.body;
  const userId = (req as CustomRequest)._id;
  try {
    const userProfile = await ProfileData.findOne({ userId });

    if (!userProfile) {
      return res.status(403).send("profile error");
    }

    userProfile.savedConversations.push({ from, to });
    await userProfile.save();

    res.status(200).send("Pair added to favorites");
  } catch (err) {
    res.status(403).send("Error");
  }
}

async function getFavorite(req: Request, res: Response) {
  const userId = (req as CustomRequest)._id;
  try {
    const userProfile = await ProfileData.findOne({ userId });

    if (!userProfile) {
      return res.status(403).send("profile error");
    }
    const savePairs = userProfile.savedConversations;
    res.status(200).json({ savePairs });
  } catch (err) {
    res.status(403).send("Error");
  }
}

async function setAlerts(req: Request, res: Response) {
  const userId = (req as CustomRequest)._id;
  const { from, to, target } = req.body;

  const userProfile = await ProfileData.findOne({ userId });

  if (!userProfile) {
    return res.status(401).send("User profile not found");
  }

  userProfile.alertPair = { from, to, target };
  await userProfile.save();

  res.redirect("/api/currency/start-monitoring");
}
async function startMonitoring(req: Request, res: Response) {
  const userId = (req as CustomRequest)._id;

  const userProfile = await ProfileData.findOne({ userId });
  const userData = await User.findOne({ _id: userId });
  if (!userProfile || !userData) {
    return res.status(401).send("User profile not found");
  }

  if (userProfile.alertPair) {
    cron.schedule(
      "0 8 * * *",
      async () =>
        await sendDailyUpdates(
          userProfile.savedConversations as savedConversationsType,
          userData.email as string
        )
    );
    cron.schedule("*/5 * * * *", async () => {
      await sendAlerts(
        userProfile.alertPair as alertPairType,
        userData.email as string
      );
    });
    res.send("Currency monitoring started.");
  } else {
    res.send("Monitoring already started.");
  }
}
export default {
  convertCurrencyRate,
  reversePair,
  getHistoricalData,
  saveFavorite,
  getFavorite,
  setAlerts,
  startMonitoring,
};
