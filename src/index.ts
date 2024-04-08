import express, { Errback, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import RateLimit from "express-rate-limit";
import v1 from "./api/v1";

const app = express();
const port = process.env.PORT || "8000";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    },
  })
);

// rate limiter: maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  validate: { xForwardedForHeader: false },
});
// To all requests
app.use(limiter);

app.use("/api/v1", v1);

app.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
  console.error("An error occurred:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
