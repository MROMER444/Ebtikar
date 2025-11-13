import express from "express";
import windowNotificationsRouter from "./datasync/notification";
import windowsp from "./routes/sp.routes";
import sdp from "./sdp/crud";
import logger from "./middlewares/logger";
import admin from "./sdp/admin";
import splogin from "./spDashboard/splogin";
import cors from "cors";


const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static("public"));

app.use(logger);

app.use("/window-notifications", windowNotificationsRouter);
app.use("/sp", windowsp);
app.use("/sdp", sdp);
app.use("/admin", admin);
app.use("/sp/auth", splogin);

app.listen(2000, "0.0.0.0", () => {
  console.log("✅ Server running on port 2000");
});