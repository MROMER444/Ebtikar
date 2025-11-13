import { Router, Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();
const router = Router();


router.post("/subscribe", async (req: Request, res: Response) => {
  const { msisdn, created_at, device_type, service_name, subscription, expiration_date, uuid, amount } = req.body;
  await prisma.subscriber_details.create({
    data: {
      msisdn,
      created_at,
      device_type,
      service_name,
      subscription,
      expiration_date,
      uuid,
      is_active: true,
      request_data: req.body
    },
  });
  console.log("Received subscription request:", req.body);
  try {
    res.status(200).json({ messageCode: "00", message: "successfull subscribe" });

  } catch (error) {
    console.log(error);
  }
});


router.post("/unsubscribe", async (req: Request, res: Response) => {
  const { msisdn, cancel_date, cancel_by, service_name, tracking_id, status } = req.body;
  console.log("Received unsubscription request:", req.body);

  try {
    const subscriber = await prisma.subscriber_details.findFirst({
      where: { msisdn },
    });

    if (!subscriber) {
      return res.status(404).json({ messageCode: "01", message: "Subscriber not found" });
    }

    await prisma.unsubscribes.create({
      data: {
        msisdn,
        service_name,
        cancel_date: new Date(cancel_date),
        cancel_by,
        tracking_id,
        status: status,
        request_data: req.body,
      },
    });

    await prisma.subscriber_details.update({
      where: { id: subscriber.id },
      data: {
        is_active: false,
      },
    });

    res.status(200).json({ messageCode: "00", message: "successful unsubscribe" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ messageCode: "99", message: "internal server error" });
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
  const {
    msisdn,
    debit_date,
    expiration_date,
    transaction_id,
    conversation_id,
    amount,
    service_name
  } = req.body;

  console.log("Received renewal request:", req.body);

  try {
    const user = await prisma.subscriber_details.findFirst({
      where: { msisdn },
    });

    if (!user) {
      return res.status(404).json({ messageCode: "01", message: "Subscriber not found" });
    }

    await prisma.renewals.create({
      data: {
        msisdn,
        service_name,
        debit_date: new Date(debit_date),
        expiration_date: new Date(expiration_date),
        transaction_id,
        conversation_id,
        amount: parseFloat(amount),
        created_at: new Date(),
        status: "SUCCESS",
        request_data: req.body
      },
    });


    await prisma.subscriber_details.update({
      where: { id: user.id },
      data: {
        expiration_date: new Date(expiration_date).toISOString(),
        is_active: true,
      },
    });

    res.status(200).json({ messageCode: "00", message: "successful renewal" });
  } catch (error) {
    console.error("Renewal error:", error);
    res.status(500).json({ messageCode: "99", message: "internal server error" });
  }
});







export default router;