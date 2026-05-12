import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, BellRing, Ban, Eye } from "lucide-react";

type Row = {
  id: number;
  title: string;
  status: "draft" | "pending" | "partially_signed" | "completed" | "voided" | "expired";
  recipientCount: number;
  signedCount: number;
  createdAt: string;
  completedAt: string | null;
};

export default function AgreementsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/signature-requests?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setRows(data.requests ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [search, status]);

  const pendingCount = useMemo(() => rows.filter(r => r.status === "pending" || r.status === "partially_signed").length, [rows]);

  const remind = async (id: number) => {
    const res = await fetch(`/api/signature-requests/${id}/remind`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) toast({ title: "Reminder sent" });
  };

  const voidReq = async (id: number) => {
    const reason = prompt("Reason for voiding this request?");
    if (!reason) return;
    const res = await fetch(`/api/signature-requests/${id}/void`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    if (res.ok) { toast({ title: "Request voided" }); fetchRows(); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Agreements</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} waiting for action</p>
        </div>
        <Link href="/esignatures"><button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm">New Agreement</button></Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agreements..." className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white/60" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 rounded-xl border bg-white/60">
          <option value="">All Status</option><option value="pending">Pending</option><option value="partially_signed">In progress</option><option value="completed">Completed</option><option value="voided">Voided</option>
        </select>
      </div>

      <div className="liquid-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Status</th><th className="text-left p-3">Recipients</th><th className="text-left p-3">Updated</th><th className="text-right p-3">Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4" colSpan={5}>Loading…</td></tr> : rows.length === 0 ? <tr><td className="p-4" colSpan={5}>No agreements found.</td></tr> : rows.map(r => (
              <tr key={r.id} className="border-t border-white/30">
                <td className="p-3">{r.title}</td><td className="p-3 capitalize">{r.status.replace("_", " ")}</td><td className="p-3">{r.signedCount}/{r.recipientCount}</td><td className="p-3">{new Date(r.completedAt ?? r.createdAt).toLocaleDateString()}</td>
                <td className="p-3"><div className="flex justify-end gap-2">
                  <Link href={`/signature-requests/${r.id}`}><button className="p-2 rounded hover:bg-muted"><Eye size={14} /></button></Link>
                  <button onClick={() => remind(r.id)} className="p-2 rounded hover:bg-muted"><BellRing size={14} /></button>
                  <button onClick={() => voidReq(r.id)} className="p-2 rounded hover:bg-muted"><Ban size={14} /></button>
                  <button onClick={() => window.open(`/api/signature-requests/${r.id}/pdf`, "_blank")} className="p-2 rounded hover:bg-muted"><Download size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
