import { Router, Request, Response } from "express";
import axios, { post } from "axios";
const router = Router();


router.post("/subscribe", async (req: Request, res: Response) => {
  const { msisdn, created_at, device_type, service_name, subscription, expiration_date } = req.body;

  try {
    res.status(200).json({ messageCode: "00", message: "successfull subscribe" });

    const response = await axios.get("https://webhook.site/35678ded-a010-4cb6-aa83-ff957f11dc82");
    const sp_response = response.data;

    if (Object.keys(sp_response).includes("messageCode") && Object.keys(sp_response).includes("message")) {
      if (sp_response.messageCode === "00" && sp_response.message === "successfull subscribe") {
        await axios.post("https://webhook.site/068cba88-4afe-48c7-bad5-b097fae4b6b2", {
          msisdn, created_at, device_type, service_name, subscription, expiration_date,
        });
      } else {
        await axios.post("https://webhook.site/068cba88-4afe-48c7-bad5-b097fae4b6b2", "{change ur response}")
      }
    }
  } catch (error) {
    console.log(error)
  }
});


router.post("/unsubscribe", async (req: Request, res: Response) => {
  const { msisdn, cancel_date, cancel_by, service_name, tracking_id, status } = req.body;

  res.status(200).json({ messageCode: "00", message: "successfull unsubscribe" });

  await axios.post("https://webhook.site/35678ded-a010-4cb6-aa83-ff957f11dc82", {
    msisdn, cancel_date, cancel_by, service_name, tracking_id, status
  });
});


router.post("/reactivate", async (req: Request, res: Response) => {
  const { msisdn, reactivate_date, reactivate_by, service_name, tracking_id } = req.body;

  res.status(200).json({ messageCode: "00", message: "successfull reactivate" });
  await axios.post("https://webhook.site/35678ded-a010-4cb6-aa83-ff957f11dc82", {
    msisdn, reactivate_date, reactivate_by, service_name, tracking_id
  });
});


router.post("/renewal", async (req: Request, res: Response) => {
  const { msisdn, debit_date, expiration_date, transaction_id, conversation_id, amount, service_name } = req.body;

  res.status(200).json({ messageCode: "00", message: "successfull renewal" });
  await axios.post("https://webhook.site/35678ded-a010-4cb6-aa83-ff957f11dc82", {
    msisdn, debit_date, expiration_date, transaction_id, conversation_id, amount, service_name
  });

});



export default router;