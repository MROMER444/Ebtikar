import { Router, Request, Response } from "express";
import axios from "axios";
const router = Router();


router.post("/subscribe", async (req: Request, res: Response) => {
  const { msisdn, created_at, device_type, service_name, subscription, expiration_date } = req.body;
  console.log("Received subscription request:", req.body);
  try {
    res.status(200).json({ messageCode: "00", message: "successfull subscribe" });

  } catch (error) {
    console.log(error)
  }
});


router.post("/unsubscribe", async (req: Request, res: Response) => {
  const { msisdn, cancel_date, cancel_by, service_name, tracking_id, status } = req.body;
  console.log("Received unsubscription request:", req.body);

  try {
    res.status(200).json({ messageCode: "00", message: "successfull unsubscribe" });
  } catch (error) {
    console.log(error);
  }
});


router.post("/reactivate", async (req: Request, res: Response) => {
  const { msisdn, reactivate_date, reactivate_by, service_name, tracking_id } = req.body;
  console.log("Received reactivation request:", req.body);
  try {
    res.status(200).json({ messageCode: "00", message: "successfull reactivate" });
  } catch (error) {
    console.log(error);
  }
});


router.post("/renewal", async (req: Request, res: Response) => {
  const { msisdn, debit_date, expiration_date, transaction_id, conversation_id, amount, service_name } = req.body;
  console.log("Received renewal request:", req.body);
  try {
    res.status(200).json({ messageCode: "00", message: "successfull renewal" });
  } catch (error) {
    console.log(error);
  }

});



export default router;