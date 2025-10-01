import { Router, Request, Response } from "express";

const router = Router();

// Subscribe
router.post("/subscribe", (req: Request, res: Response) => {
  const { msisdn, created_at, device_type, service_name, subscription, expiration_date } = req.body;

  try {
    res.status(200).json({
    messageCode: "00",
    message: "successfull subscribe",
    details : req.body
  });
  } catch (error) {
    console.log(error)
  }
});

// Unsubscribe
router.post("/unsubscribe", (req: Request, res: Response) => {
  const { msisdn, cancel_date, cancel_by, service_name, tracking_id, status } = req.body;

  res.status(200).json({
    messageCode: "00",
    message: "successfull unsubscribe",
  });
});

// Reactivate
router.post("/reactivate", (req: Request, res: Response) => {
  const { msisdn, reactivate_date, reactivate_by, service_name, tracking_id } = req.body;

  res.status(200).json({
    messageCode: "00",
    message: "successfull reactivate",
  });
});

// Renewal
router.post("/renewal", (req: Request, res: Response) => {
  const { msisdn, debit_date, expiration_date, transaction_id, conversation_id, amount, service_name } = req.body;

  res.status(200).json({
    messageCode: "00",
    message: "successfull renewal",
  });
});

export default router;
