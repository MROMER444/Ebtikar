import { Request, Response, NextFunction } from "express";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "../../logs/request.log");

// Ensure logs folder exists
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const logger = (req: Request, res: Response, next: NextFunction) => {
  const { body: requestBody, originalUrl } = req;
  const originalSend = res.send;

  res.send = function (body?: any) {
    let parsedResponse: any;

    try {
      parsedResponse = typeof body === "string" ? JSON.parse(body) : body;
    } catch {
      parsedResponse = body;
    }

    // Optional: extract user if present in request (e.g., req.user)
    const userInfo =
      (req as any).user
        ? JSON.stringify((req as any).user, null, 2)
        : "N/A";

    const logMessage = `
====== Request & Response ======
Endpoint : ${originalUrl}
User     : ${userInfo}
Request  : ${JSON.stringify(requestBody, null, 2)}
Response : ${JSON.stringify(parsedResponse, null, 2)}
===============================

`;

    // Save to file
    fs.appendFileSync(logFile, logMessage);

    return originalSend.call(this, body);
  };

  next();
};

export default logger;
