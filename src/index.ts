import express from "express";
import windowNotificationsRouter from "./datasync/notification";
import windowsp from "./routes/sp.routes";
import logger from "./middlewares/logger";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static("public"));

app.use(logger);

app.use("/window-notifications", windowNotificationsRouter);
app.use("/sp", windowsp);

app.listen(2000, "0.0.0.0", () => {
  console.log("✅ Server running on port 2000");
});