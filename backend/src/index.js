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

const isValidTableName = (tableName) => /^[a-zA-Z0-9_]+$/.test(tableName);

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateTableName = (tableName, res) => {
  if (!isValidTableName(tableName)) {
    res.status(400).json({
      error: "Invalid table name. Use letters, numbers, and underscores only.",
    });
    return false;
  }
  return true;
};

const validateSupabase = (res) => {
  if (!supabase) {
    res.status(500).json({
      error:
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend environment.",
    });
    return false;
  }
  return true;
};

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    supabaseConfigured: Boolean(supabase),
  });
});

app.get("/api/table/:tableName", async (req, res) => {
  if (!validateSupabase(res)) {
    return;
  }

  const tableName = req.params.tableName;
  if (!validateTableName(tableName, res)) {
    return;
  }

  const limit = Number.parseInt(req.query.limit, 10) || 20;
  const offset = Number.parseInt(req.query.offset, 10) || 0;
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    table: tableName,
    count: data.length,
    limit: safeLimit,
    offset: safeOffset,
    rows: data,
  });
});

app.post("/api/table/:tableName", async (req, res) => {
  if (!validateSupabase(res)) {
    return;
  }

  const tableName = req.params.tableName;
  if (!validateTableName(tableName, res)) {
    return;
  }

  const row = req.body?.row;
  if (!isPlainObject(row)) {
    return res.status(400).json({
      error: "Body must include a `row` object.",
    });
  }

  const { data, error } = await supabase.from(tableName).insert(row).select("*");
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    table: tableName,
    inserted: data.length,
    rows: data,
  });
});

app.patch("/api/table/:tableName", async (req, res) => {
  if (!validateSupabase(res)) {
    return;
  }

  const tableName = req.params.tableName;
  if (!validateTableName(tableName, res)) {
    return;
  }

  const match = req.body?.match;
  const row = req.body?.row;

  if (!isPlainObject(match) || Object.keys(match).length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `match` object.",
    });
  }

  if (!isPlainObject(row) || Object.keys(row).length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `row` object.",
    });
  }

  let query = supabase.from(tableName).update(row).select("*");
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    table: tableName,
    updated: data.length,
    rows: data,
  });
});

app.delete("/api/table/:tableName", async (req, res) => {
  if (!validateSupabase(res)) {
    return;
  }

  const tableName = req.params.tableName;
  if (!validateTableName(tableName, res)) {
    return;
  }

  const match = req.body?.match;
  if (!isPlainObject(match) || Object.keys(match).length === 0) {
    return res.status(400).json({
      error: "Body must include a non-empty `match` object.",
    });
  }

  let query = supabase.from(tableName).delete().select("*");
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({
    table: tableName,
    deleted: data.length,
    rows: data,
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
