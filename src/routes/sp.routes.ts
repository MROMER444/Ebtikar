import { Router, Request, Response } from "express";
import req from "express";
import axios from "axios";
import FormData from "form-data";
const router = Router();
import express from "express";
const app = express();

import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();




async function getSpIdFromHeaders(providerID: string | undefined) {
    if (!providerID) {
        return { status: 400, success: false, message: "Missing service provider ID in headers" };
    }

    const spId = await prisma.serviceProvider.findUnique({
        where: { id: providerID },
        select: {
            email: true,
            password: true
        }
    });

    if (!spId) {
        return { status: 404, success: false, message: "Service Provider not found" };
    } else {
        return { status: 200, success: true, data: spId };
    }
}



router.get("/get-sp-id", async (req: Request, res: Response) => {
    try {

        const providerID = req.headers["spid"] as string;
        const ipAddress = req.ip as string;

        console.log("Request IP Address:", ipAddress);
        const checkIP = await prisma.serviceProvider.findFirst({
            where: { ipAddress },
        });

        if (!checkIP) {
            return res.status(403).json({
                success: false,
                message: "Access denied: IP not whitelisted",
                clientIP: ipAddress,
            });
        }

        if (!providerID) {
            return res.status(400).json({ message: "Missing spid in headers" });
        }

        const spRecord = await getSpIdFromHeaders(providerID);
        if (!spRecord) {
            return res.status(404).json({ message: "Service Provider not found" });
        }

        return res.status(200).json({ success: true, data: spRecord });

    } catch (error: any) {

        return res.status(500).json({
            success: false,
            message: "Error retrieving Service Provider",
            error: error.message,
        });
    }
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

export const isTokenValid = (): boolean => {
    if (!accessToken || !tokenExpiryTime) return false;
    return Date.now() < tokenExpiryTime;
}


async function getValidToken(email: any, password: any, req: Request): Promise<string> {

    const spid = req.headers["spid"] as string;
    if (!spid) {
        throw new Error("Missing SP-ID in headers");
    }
    const spidheader = await getSpIdFromHeaders(spid);
    if (isTokenValid()) {
        const remainingMs = tokenExpiryTime! - Date.now();
        const remainingMin = Math.floor(remainingMs / 60000);

        console.log("Remaining token validity (minutes):", remainingMin);
        return accessToken!;
    }

    const formData = new FormData();

    formData.append("email", spidheader.data?.email);
    formData.append("password", spidheader.data?.password);

    const response = await axios.post("https://connextst.ebtekarcloud.com/external-api/auth-login",
        formData,
        { headers: formData.getHeaders() }
    );


    const data = response.data.data;
    accessToken = data.access_token.trim();

    tokenExpiryTime = Date.now() + data.expired_after * 1000;
    console.log("Access Token:", accessToken);
    return accessToken!;
}


router.post("/auth-login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log(req.body);

    if (!email || !password) {
        return res.status(400).json({ message: "please provide Email , Password" });
    }


    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password)

    try {
        const response = await axios.post(
            "https://connextst.ebtekarcloud.com/external-api/auth-login",
            formData,
            { headers: formData.getHeaders() });

        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            message: "Login to Connex failed",
            error: error.response?.data || error.message,
        });
    }
});


router.get("/protected-script", async (req: Request, res: Response) => {
    const { targeted_element } = req.query;
    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);

    if (!spidheader) {
        return res.status(400).json({ message: "Invalid SP-ID in headers" });
    }

    const authHeader = req.headers.authorization;

    const element = targeted_element?.toString().startsWith("#")
        ? targeted_element
        : `#${targeted_element}`;

    try {
        let tokenToUse: string;

        if (authHeader) {
            tokenToUse = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`;
        } else {
            const token = await getValidToken(spidheader.data?.email, spidheader.data?.password, req);
            tokenToUse = `Bearer ${token}`;
            console.log(token);
        }


        console.log("element:", element);


        const response = await axios.get(
            "https://connextst.ebtekarcloud.com/external-api/protected-script",
            {
                headers: { Authorization: tokenToUse },
                params: { targeted_element: element },
            }
        );


        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            message: "Fetching protected script failed",
            error: error.response?.data || error.message,
        });
    }
});


router.post("/send-otp", async (req: Request, res: Response) => {
    try {
        const SPid = req.headers["spid"];
        console.log(SPid);
        if (!SPid) {
            return res.status(400).json({ success: false, message: "Missing SP-ID in headers" });
        }

        const {
            msisdn,
            device_type,
            otp_signature,
            dcb_script_owner,
            transaction_identify,
        } = req.body;

        if (!msisdn || !device_type || !transaction_identify) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const spid = req.headers["spid"] as string;
        const spidheader = await getSpIdFromHeaders(spid);

        if (!spidheader) {
            return res.status(400).json({ message: "Invalid spid in headers" });
        }

        const token = await getValidToken(spidheader.data?.email, spidheader.data?.password, req);

        const formData = new URLSearchParams();
        formData.append("msisdn", msisdn);
        formData.append("transaction_identify", transaction_identify);
        formData.append("device_type", device_type);

        if (otp_signature) formData.append("otp_signature", otp_signature);
        if (dcb_script_owner) formData.append("dcb_script_owner", dcb_script_owner);

        console.log("token:", token);

        const response = await axios.post(
            "https://connextst.ebtekarcloud.com/external-api/login",
            formData.toString(),
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 10000,
            }
        );

        console.log("data:", response.data);

        return res.status(200).json({
            success: true,
            message: "OTP request sent successfully",
            data: response.data,
        });

    } catch (error: any) {
        console.error("Error during OTP request:", error.message);

        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Aggregator login failed",
            error: error.response?.data || error.toString(),
        });
    }
});



router.post("/verify-otp", async (req: Request, res: Response) => {

    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);
    if (!spidheader.success) {
        return res.status(spidheader.status).json({ success: false, message: spidheader.message });
    }
    try {
        const { msisdn, otp, device_type, campaign_id, tracking_id } = req.body;

        if (!msisdn || !otp || !device_type) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const formData = new FormData();
        formData.append("msisdn", msisdn);
        formData.append("otp", otp);
        formData.append("device_type", device_type);

        if (campaign_id) formData.append("campaign_id", campaign_id);
        if (tracking_id) formData.append("tracking_id", tracking_id);

        const token = await getValidToken(spidheader.data?.email, spidheader.data?.password, req);

        const response = await axios.post("https://connextst.ebtekarcloud.com/external-api/login-confirm",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Accept: "application/json",
                    Authorization: `$Bearer ${token}`
                },
            }

        );

        let responseData = response.data;

        if (typeof responseData === "string") {
            try {
                const cleaned = responseData
                    .replace(/[\u0000-\u001F\u007F-\u009F\u00A0]/g, "")
                    .trim();
                responseData = JSON.parse(cleaned);
            } catch (err) {
                console.warn("Still not parsable, returning raw string");
            }
        };

        res.status(200).json({
            success: true,
            message: "Response from aggregator",
            data: responseData,
        });
    } catch (error: any) {

        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
});


router.get("/subscriber-details", async (req: Request, res: Response) => {
    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);
    if (!spidheader.success) {
        return res.status(spidheader.status).json({ success: false, message: spidheader.message });
    }
    try {
        const { msisdn } = req.query;

        if (!msisdn) {
            return res.status(400).json({ message: "msisdn is required" });
        } else {
            const response = await axios.get("https://connextst.ebtekarcloud.com/external-api/subscriber-details",
                {
                    params: { msisdn },
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${await getValidToken(spidheader.data?.email, spidheader.data?.password, req)}`
                    },
                }
            )
            return res.status(200).json({ success: true, data: response.data });
        }

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            details: error.response?.data || null,
        });
    }
});



router.get("/subscriber-transactions", async (req: Request, res: Response) => {
    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);
    if (!spidheader) {
        return res.status(400).json({ message: "Invalid SP-ID in headers" });
    }
    try {
        const { msisdn } = req.query;
        if (!msisdn) {
            return res.status(400).json({ message: "msisdn is required" });
        } else {
            const response = await axios.get("https://connextst.ebtekarcloud.com/external-api/subscriber-transactions",
                {
                    params: { msisdn },
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${await getValidToken(spidheader.data?.email, spidheader.data?.password, req)}`
                    },
                }
            )
            return res.status(200).json({ success: true, data: response.data });
        }

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
            details: error.response?.data || null,
        });
    }
});




router.post("/unsubscribe", async (req: Request, res: Response) => {
    const { msisdn } = req.body;
    if (!msisdn) {
        return res.status(400).json({ message: "msisdn is required" });
    }

    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);
    if (!spidheader.success) {
        return res.status(spidheader.status).json({ success: false, message: spidheader.message });
    } else {
        try {
            const response = await axios.post("https://connextst.ebtekarcloud.com/external-api/unsubscribe",
                new URLSearchParams({ msisdn }).toString(),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${await getValidToken(spidheader.data?.email, spidheader.data?.password, req)}` },
                }
            );
            return res.status(200).json({ success: true, data: response.data });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error during unsubscription",
                details: error,
            });
        }
    }

});




router.post("/unsubscribe-confirm", async (req: Request, res: Response) => {
    const { msisdn, otp, device_type } = req.body;
    if (!msisdn || !otp || !device_type) {
        return res.status(400).json({ message: "msisdn , otp and device_type are required" });
    }

    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);
    if (!spidheader.success) {
        return res.status(spidheader.status).json({ success: false, message: spidheader.message });
    } else {
        try {
            const response = await axios.post("https://connextst.ebtekarcloud.com/external-api/unsubscribe-confirm",
                new URLSearchParams({ msisdn, otp, device_type }).toString(),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${await getValidToken(spidheader.data?.email, spidheader.data?.password, req)}` },
                }
            );
            return res.status(200).json({ success: true, data: response.data });
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 422) {
                    return res.status(422).json({
                        success: false,
                        message: "User is already unsubscribed or OTP is invalid/expired",
                        details: error.response.data,
                    });
                }
            }

            return res.status(500).json({
                success: false,
                message: "Error during unsubscription confirmation",
                details: error.message,
            });
        }

    }

});



router.post("/admin/direct-unsubscribe", async (req: Request, res: Response) => {
  try {
    const { msisdn } = req.body;

    if (!msisdn) {
      return res.status(400).json({ success: false, message: "MSISDN is required" });
    }

    // Get SP ID from header
    const spid = req.headers["spid"] as string;
    const spidheader = await getSpIdFromHeaders(spid);

    if (!spidheader.success) {
      return res.status(spidheader.status).json({ success: false, message: spidheader.message });
    }

    // Get valid token using your helper
    const token = await getValidToken(spidheader.data?.email, spidheader.data?.password, req);

    // Prepare the request to aggregator
    const formData = new FormData();
    formData.append("msisdn", msisdn);

    const response = await axios.post(
      "https://connextst.ebtekarcloud.com/external-api/direct-unsubscribe",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Update DB
    await prisma.subscriber_details.updateMany({
      where: { msisdn },
      data: { is_active: false },
    });

    return res.status(200).json({
      success: true,
      message: `User ${msisdn} unsubscribed successfully`,
      aggregator_response: response.data,
    });

  } catch (error: any) {
    console.error("Direct unsubscribe error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error during direct unsubscribe",
      details: error.response?.data || error.message,
    });
  }
});




export default router;