//this si dev env
import { Router, Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
const router = Router();
import express from "express";
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

        console.log("Remaining token validity (minutes):", remainingMin);
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
    accessToken = data.access_token.trim();

    tokenExpiryTime = Date.now() + data.expired_after * 1000;
    console.log("Access Token:", accessToken);
    return accessToken!;



}


async function getTransactionIdentify_dcbProtect(req: Request, res: Response): Promise<{ transaction_identify: string, dcbprotect: string }> {
    const response = await axios.get("https://connextst.ebtekarcloud.com/external-api/protected-script",
        {
            headers: { Authorization: `Bearer ${await getValidToken()}` },
            params: { targeted_element: "form-login" },

        }
    )

    const transaction_identify = String(response.data.success.transaction_identify ?? "");
    const dcbprotect = String(response.data.success.dcbprotect ?? "");
    return { transaction_identify, dcbprotect };

}



router.get("/transaction-identify", async (req: Request, res: Response) => {

    try {
        const details = (await getTransactionIdentify_dcbProtect(req, res));
        res.status(200).json({ transaction_identify_dcbprotect: details });
    } catch (error: any) {
        res.status(500).json({
            message: "Error fetching transaction identify",
            error: error.response?.data || error.message,
        });
    }
});

const allowedOrigins = ["http://api.window-technologies.com", "https://another.com"];

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
            message: "Fetching protected script from Connex failed",
            error: error.response?.data || error.message,
        });
    }
});

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


router.post("/send-otp", async (req: Request, res: Response) => {
    console.log("this is the origin : ", req.headers.origin);
    console.log("send otp request..........");
    console.log("Body:", req.body);

    console.log("---------------------------------------------------------");


    var origin = req.headers.origin || "";
    origin = "http://my-custom-origin.com";
    console.log("this is the Origin : ", origin);


    if (allowedOrigins.includes(origin)) {
        console.log("good to goooooo");
    } else {
        console.log("forbiden");

    }


    try {
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

        const token = await getValidToken();

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
            message: "Error calling aggregator",
            data: error.response?.data || null
        });

    }

});


export default router;