import express, { Errback } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import v1 from "./api/v1";

const app = express();
const port = process.env.PORT || "8000";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api/v1", v1);

app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  return console.log(`Server is listening on ${port}`);
});
