import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
const router = Router();


let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

const AGGREGATOR_EMAIL = "example@email.com";
const AGGREGATOR_PASSWORD = "password";


export const isTokenValid = (): boolean => {
    if (!accessToken || !tokenExpiryTime) return false;
    return Date.now() < tokenExpiryTime;
}



export const getValidToken = async (): Promise<string> => {
    if (isTokenValid()) {
        const remainingMs = tokenExpiryTime! - Date.now();
        const remainingMin = Math.floor(remainingMs / 60000);
        console.log(` Token valid — expires in ~${remainingMin} minutes`);
        return accessToken!;
    }

    console.log("Token expired or missing — fetching new one...");

    const formData = new FormData();

    formData.append("email", AGGREGATOR_EMAIL);
    formData.append("password", AGGREGATOR_PASSWORD);

    const response = await axios.post("https://webhook.site/3df92686-3f42-471f-8d1e-03f72609b990",
        formData,
        { headers: formData.getHeaders() }
    );

    const data = response.data.data;
    accessToken = data.access_token;

    tokenExpiryTime = Date.now() + data.expired_after * 1000;

    console.log(
        `✅ Token refreshed successfully. Expires in ${data.expired_after / 60} minutes`
    );

    return accessToken!;

}


router.post("/auth-login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password)

    try {
        const response = await axios.post(
            "https://webhook.site/3df92686-3f42-471f-8d1e-03f72609b990",
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

    if (!authHeader) {
        return res.status(401).json({ message: "Missing Authorization header from SP" });
    }

    try {
        const response = await axios.get(
            `https://webhook.site/1bf14403-d3e1-4a54-9a02-9f653f8af933`,
            {
                headers: {
                    Authorization: authHeader,
                },
                params: {
                    targeted_element,
                },
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
        const { msisdn, transaction_identify, device_type, otp_signature, dcb_script_owner } = req.body;

        const formData = new URLSearchParams();
        formData.append("msisdn", msisdn);
        formData.append("transaction_identify", transaction_identify);
        formData.append("device_type", device_type);

        if (otp_signature) formData.append("otp_signature", otp_signature);
        if (dcb_script_owner) formData.append("dcb_script_owner", dcb_script_owner);

        const token = await getValidToken();

        const response = await axios.post("https://webhook.site/5e9cbad7-9d73-4ef1-bcee-e4ed1b335efa",
            formData,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = response.data;

        if (data) {
            res.status(200).json({
                success: true,
                message: "data has been fetched",
                data: data || null
            });
        } else {

            res.status(200).json({
                success: data.status || false,
                message: data.message || "No message from aggregator",
                data: data.data || null,
            });
        }

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
        console.log("Error calling aggregator:", error.response?.data || error.message);

        res.status(500).json({
            success: false,
            message: "Error calling aggregator",
            data: error.response?.data || null
        });

    }

});


export default router;