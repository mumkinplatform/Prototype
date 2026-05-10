import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type HealthResponse = {
  status: "ok" | "error";
  database: "connected" | "unreachable";
  message?: string;
};

export function SystemStatus() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<HealthResponse>("/health/db")
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl" style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h1>حالة النظام</h1>

      {loading && (
        <p style={{ color: "#666" }}>جاري التحقق من الاتصال بالباك اند...</p>
      )}

      {error && (
        <div style={{ padding: "1rem", background: "#fee", border: "1px solid #fcc", borderRadius: 8 }}>
          <strong>❌ فشل الاتصال:</strong>
          <p>{error}</p>
          <small>تأكدي إن الباك اند شغال على المنفذ 3000، وإن MySQL مشغل في XAMPP.</small>
        </div>
      )}

      {data && (
        <div style={{ padding: "1rem", background: "#efe", border: "1px solid #cfc", borderRadius: 8 }}>
          <strong>✅ كل شي شغال</strong>
          <ul>
            <li>الباك اند: {data.status}</li>
            <li>قاعدة البيانات: {data.database}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
