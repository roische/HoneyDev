import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const defaultTableName = import.meta.env.VITE_DEFAULT_TABLE_NAME || "profiles";
const defaultLimit = Number.parseInt(import.meta.env.VITE_DEFAULT_LIMIT, 10) || 10;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const asPrettyJson = (value) => JSON.stringify(value, null, 2);

const parseJsonObject = (raw, fieldName) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} must be valid JSON.`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }

  return parsed;
};

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [health, setHealth] = useState(null);
  const [tableName, setTableName] = useState(defaultTableName);
  const [limit, setLimit] = useState(defaultLimit);
  const [rowsResult, setRowsResult] = useState(null);
  const [crudResult, setCrudResult] = useState(null);
  const [createJson, setCreateJson] = useState('{\n  "name": "demo"\n}');
  const [updateMatchJson, setUpdateMatchJson] = useState('{\n  "id": 1\n}');
  const [updateRowJson, setUpdateRowJson] = useState('{\n  "name": "updated-name"\n}');
  const [deleteMatchJson, setDeleteMatchJson] = useState('{\n  "id": 1\n}');
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const prettyRows = useMemo(
    () => (rowsResult ? asPrettyJson(rowsResult) : ""),
    [rowsResult]
  );

  const prettyCrud = useMemo(
    () => (crudResult ? asPrettyJson(crudResult) : ""),
    [crudResult]
  );

  const callApi = async (path, options = {}) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || "Request failed");
    }
    return json;
  };

  const signIn = async () => {
    setError("");
    setAuthMessage("");

    if (!supabase) {
      setError("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend env.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setAuthMessage("Signed in.");
  };

  const signOut = async () => {
    setError("");
    setAuthMessage("");

    if (!supabase) {
      setError("Supabase client is not configured.");
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setAuthMessage("Signed out.");
  };

  const fetchHealth = async () => {
    setError("");
    try {
      const json = await callApi("/api/health");
      setHealth(json);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchRows = async () => {
    setError("");
    try {
      const safeLimit = Math.min(Math.max(limit || 10, 1), 100);
      const json = await callApi(
        `/api/table/${encodeURIComponent(tableName)}?limit=${safeLimit}&offset=0`
      );
      setRowsResult(json);
    } catch (err) {
      setError(err.message);
    }
  };

  const createRow = async () => {
    setError("");
    try {
      const row = parseJsonObject(createJson, "Create row");
      const json = await callApi(`/api/table/${encodeURIComponent(tableName)}`, {
        method: "POST",
        body: JSON.stringify({ row }),
      });
      setCrudResult(json);
      await fetchRows();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRows = async () => {
    setError("");
    try {
      const match = parseJsonObject(updateMatchJson, "Update match");
      const row = parseJsonObject(updateRowJson, "Update row");
      const json = await callApi(`/api/table/${encodeURIComponent(tableName)}`, {
        method: "PATCH",
        body: JSON.stringify({ match, row }),
      });
      setCrudResult(json);
      await fetchRows();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRows = async () => {
    setError("");
    try {
      const match = parseJsonObject(deleteMatchJson, "Delete match");
      const json = await callApi(`/api/table/${encodeURIComponent(tableName)}`, {
        method: "DELETE",
        body: JSON.stringify({ match }),
      });
      setCrudResult(json);
      await fetchRows();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container">
      <h1>HoneyDev Fullstack Template</h1>
      <p>API Base URL: {apiBaseUrl}</p>

      <section>
        <button onClick={fetchHealth}>Check Backend Health</button>
        {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      </section>

      <section>
        <h2>Supabase Auth (email/password)</h2>
        <p>
          Frontend Supabase configured:{" "}
          <strong>{supabase ? "yes" : "no"}</strong>
        </p>
        <p>
          Session status: <strong>{session ? "signed-in" : "signed-out"}</strong>
        </p>
        {session?.user?.email && <p>Signed user: {session.user.email}</p>}
        <div className="row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
          />
        </div>
        <div className="row button-row">
          <button onClick={signIn}>Sign In</button>
          <button onClick={signOut} className="secondary">
            Sign Out
          </button>
        </div>
        {authMessage && <p className="hint">{authMessage}</p>}
      </section>

      <section>
        <h2>Read rows</h2>
        <label htmlFor="table-name">Supabase table name</label>
        <div className="row">
          <input
            id="table-name"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="profiles"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(event) =>
              setLimit(Number.parseInt(event.target.value, 10) || 10)
            }
            placeholder="10"
          />
          <button onClick={fetchRows}>Fetch Rows</button>
        </div>
        <p className="hint">Limit은 1~100 사이로 자동 보정됩니다.</p>
        {prettyRows && <pre>{prettyRows}</pre>}
      </section>

      <section>
        <h2>CRUD via backend</h2>
        <label htmlFor="create-row-json">Create row JSON</label>
        <textarea
          id="create-row-json"
          value={createJson}
          onChange={(event) => setCreateJson(event.target.value)}
        />
        <div className="row button-row">
          <button onClick={createRow}>Create Row</button>
        </div>

        <label htmlFor="update-match-json">Update match JSON</label>
        <textarea
          id="update-match-json"
          value={updateMatchJson}
          onChange={(event) => setUpdateMatchJson(event.target.value)}
        />

        <label htmlFor="update-row-json">Update row JSON</label>
        <textarea
          id="update-row-json"
          value={updateRowJson}
          onChange={(event) => setUpdateRowJson(event.target.value)}
        />
        <div className="row button-row">
          <button onClick={updateRows}>Update Rows</button>
        </div>

        <label htmlFor="delete-match-json">Delete match JSON</label>
        <textarea
          id="delete-match-json"
          value={deleteMatchJson}
          onChange={(event) => setDeleteMatchJson(event.target.value)}
        />
        <div className="row button-row">
          <button onClick={deleteRows} className="danger">
            Delete Rows
          </button>
        </div>

        {prettyCrud && <pre>{prettyCrud}</pre>}
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
