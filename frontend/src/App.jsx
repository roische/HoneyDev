import { useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function App() {
  const [health, setHealth] = useState(null);
  const [tableName, setTableName] = useState("profiles");
  const [rowsResult, setRowsResult] = useState(null);
  const [error, setError] = useState("");

  const prettyRows = useMemo(
    () => (rowsResult ? JSON.stringify(rowsResult, null, 2) : ""),
    [rowsResult]
  );

  const fetchHealth = async () => {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);
      const json = await response.json();
      setHealth(json);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchRows = async () => {
    setError("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/table/${encodeURIComponent(tableName)}?limit=10`
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch table rows");
      }
      setRowsResult(json);
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
        <label htmlFor="table-name">Supabase table name</label>
        <div className="row">
          <input
            id="table-name"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="profiles"
          />
          <button onClick={fetchRows}>Fetch Rows</button>
        </div>
        {prettyRows && <pre>{prettyRows}</pre>}
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
