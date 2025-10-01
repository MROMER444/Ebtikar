import express from "express";
import connexNotificationsRouter from "./datasync/notification";

const app = express();

// Parse JSON and form-data globally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount router
app.use("/connex-notifications", connexNotificationsRouter);

app.listen(2000, () => {
  console.log("Server running on port 2000");
});
