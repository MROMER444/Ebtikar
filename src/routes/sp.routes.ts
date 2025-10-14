import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
const router = Router();


let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

const AGGREGATOR_EMAIL = "api-gamesleague@digitalfalcon.ly";
const AGGREGATOR_PASSWORD = "G@m%#guE";


export const isTokenValid = (): boolean => {
    if (!accessToken || !tokenExpiryTime) return false;
    return Date.now() < tokenExpiryTime;
}



export const getValidToken = async (): Promise<string> => {
    if (isTokenValid()) {
        const remainingMs = tokenExpiryTime! - Date.now();
        const remainingMin = Math.floor(remainingMs / 60000);
        return accessToken!;
    }


    const formData = new FormData();

    formData.append("email", AGGREGATOR_EMAIL);
    formData.append("password", AGGREGATOR_PASSWORD);

    const response = await axios.post("https://connextst.ebtekarcloud.com/external-api/auth-login",
        formData,
        { headers: formData.getHeaders() }
    );

    const data = response.data.data;
    accessToken = data.access_token;

    tokenExpiryTime = Date.now() + data.expired_after * 1000;
    return accessToken!;

}


router.post("/auth-login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

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
    const authHeader = req.headers.authorization;

    const element = targeted_element?.toString().startsWith("#")
        ? targeted_element
        : `#${targeted_element}`;

    try {
        let tokenToUse: string;

        if (authHeader) {
            tokenToUse = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`;
        } else {
            const token = await getValidToken();
            tokenToUse = `Bearer ${token}`;
            console.log(token);

        }


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
            message: "Fetching protected script from Connex failed",
            error: error.response?.data || error.message,
        });
    }
});





router.post("/send-otp", async (req: Request, res: Response) => {
    try {
        const { msisdn, device_type, otp_signature, dcb_script_owner, targeted_element } = req.body;

        if (!msisdn || !device_type) {
            return res.status(400).json({ message: "msisdn and device_type are required" });
        }

        const token = await getValidToken();

        const protectedResponse = await axios.get(
            "https://connextst.ebtekarcloud.com/external-api/protected-script",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    targeted_element: targeted_element || "#cta_button",
                },
            }
        );

        const transaction_identify = protectedResponse.data?.success?.transaction_identify;

        if (!transaction_identify) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve transaction_identify from protected-script",
                data: protectedResponse.data,
            });
        }

        const formData = new URLSearchParams();
        formData.append("msisdn", msisdn);
        formData.append("transaction_identify", transaction_identify);
        formData.append("device_type", device_type);

        if (otp_signature) formData.append("otp_signature", otp_signature);
        if (dcb_script_owner) formData.append("dcb_script_owner", dcb_script_owner);

        const response = await axios.post(
            "https://connextst.ebtekarcloud.com/external-api/login",
            formData,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        res.status(200).json({
            success: true,
            message: "OTP request sent successfully",
            data,
        });

    } catch (error: any) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || "Aggregator login failed",
            error: error.response?.data || error.message,
        });
    }
});




router.post("/verify-otp", async (req: Request, res: Response) => {
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

        const token = await getValidToken();

        const response = await axios.post("https://webhook.site/957d26ec-466f-4229-aa86-f517ce54afdd",
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
            message: "Error calling aggregator",
            data: error.response?.data || null
        });

    }

});


export default router;