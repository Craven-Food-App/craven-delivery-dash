import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { env } from "./env.js";
import documentsRoute from "./routes/documents.js";

const app = express();

app.use(cors({ origin: env.ORIGIN, credentials: true }));
app.use(bodyParser.json({ limit: "10mb" }));

app.use("/api/documents", documentsRoute);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(env.PORT, () => {
  console.log(`Server listening on :${env.PORT}`);
});

