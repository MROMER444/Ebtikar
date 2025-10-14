const axios = require("axios");

let accessToken = null;
let tokenExpiryTime = null;

const isTokenValid = () => {
    if (!accessToken || !tokenExpiryTime) return false;
    return Date.now() < tokenExpiryTime;
};

const getValidToken = async () => {
    if (isTokenValid()) {
        const remainingMs = tokenExpiryTime - Date.now();
        const remainingMin = Math.floor(remainingMs / 60000);
        console.log(`Using existing token (expires in ${remainingMin} minutes)`);
        return accessToken;
    } else {
        console.log("Token expired or missing. Please fetch a new one.");
        throw new Error("Token is not valid or expired.");
    }
};

async function getTransactionIdentify() {
    try {
        const token = await getValidToken();
        const response = await axios.get(
            "https://connextst.ebtekarcloud.com/external-api/protected-script",
            {
                headers: { Authorization: token },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching transaction identify:", error.message);
    }
}

// run
(async () => {
    const result = await getTransactionIdentify();
    console.log(result);
})();
