import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    supabaseConfigured: Boolean(supabase),
  });
});

app.get("/api/table/:tableName", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({
      error:
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment.",
    });
  }

  const tableName = req.params.tableName;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({
      error: "Invalid table name. Use letters, numbers, and underscores only.",
    });
  }

  const limit = Number.parseInt(req.query.limit, 10) || 20;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .limit(safeLimit);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ table: tableName, count: data.length, rows: data });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
