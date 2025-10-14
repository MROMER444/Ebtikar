import express from "express";
import windowNotificationsRouter from "./datasync/notification";
import windowsp from "./routes/sp.routes";
import logger from "./middlewares/logger";

const app = express();

app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => {
    if (!data) {
      (req as any).body = {};
      return next();
    }

    if (req.headers['content-type']?.includes('application/json')) {
      try {
        (req as any).body = JSON.parse(data);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON format' });
      }
    } else {
      (req as any).body = {};
    }

    next();
  });
});



app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use("/window-notifications", windowNotificationsRouter);
app.use("/sp", windowsp);

app.listen(2000, 'localhost', () => {
  console.log('Server running on port 2000');
});
