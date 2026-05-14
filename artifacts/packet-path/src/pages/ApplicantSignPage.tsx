import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle, ChevronRight, Lock, PenTool, RotateCcw, Shield } from "lucide-react";

type PageState = "loading" | "ready" | "success" | "already_signed" | "declined" | "expired" | "voided" | "error";
type Step = "review" | "sign";
type SignatureMode = "typed" | "drawn";

interface SigningSession {
  requestId: number;
  requestTitle: string;
  message: string | null;
  documentContent: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  status: string;
  organizationName: string;
}

function StatusPage({ state, name }: { state: PageState; name?: string }) {
  const copy: Record<PageState, [string, string]> = {
    loading: ["Loading secure request", "Please wait while we open your document."],
    ready: ["Ready", "Your document is ready."],
    success: ["Document signed", "Your document has been completed. You may close this window."],
    already_signed: ["Already signed", "This document has already been signed."],
    declined: ["Signature declined", "This request has been declined."],
    expired: ["Link expired", "This secure link has expired. Please request a new invitation."],
    voided: ["Request voided", "This request is no longer available."],
    error: ["Invalid link", "This signing link is invalid or unavailable."],
  };
  const Icon = state === "success" || state === "already_signed" ? CheckCircle : state === "loading" ? Lock : AlertCircle;
  return (
    <div className="min-h-screen luminous-gradient flex items-center justify-center p-6">
      <div className="tahoe-panel max-w-lg rounded-[34px] p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10">
          <Icon className={state === "success" ? "text-[#8dbeb5]" : "text-amber-200"} size={32} />
        </div>
        <h1 className="text-3xl font-semibold text-white">{copy[state][0]}</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">{copy[state][1]}</p>
        {state === "success" && name && <p className="mt-5 text-xs text-white/55">Signed by {name} · {new Date().toLocaleString()}</p>}
      </div>
    </div>
  );
}

function SignatureCanvas({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const hasDrawn = useRef(false);

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const pointer = "touches" in e ? e.touches[0] : e;
    return {
      x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
      y: (pointer.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    last.current = getPoint(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#052a32";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    last.current = p;
    hasDrawn.current = true;
  }

  function stop() {
    drawing.current = false;
    if (hasDrawn.current && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange("");
  }

  return (
    <div className="relative rounded-[24px] border border-white/30 bg-white/90 p-2">
      <canvas
        ref={canvasRef}
        width={720}
        height={220}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        className="h-52 w-full touch-none rounded-[18px] bg-white"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#527b78]/35">Sign here</div>
      <button type="button" onClick={clear} className="absolute right-4 top-4 rounded-full bg-white p-2 text-[#031219] shadow">
        <RotateCcw size={15} />
      </button>
    </div>
  );
}

export default function ApplicantSignPage({ token }: { token: string }) {
  const [session, setSession] = useState<SigningSession | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [step, setStep] = useState<Step>("review");
  const [mode, setMode] = useState<SignatureMode>("typed");
  const [typedName, setTypedName] = useState("");
  const [drawnSig, setDrawnSig] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const reviewFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sign/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState((data.status as PageState) || "error");
          return;
        }
        const data = await res.json();
        setSession(data);
        setTypedName(data.recipientName || "");
        await fetch(`/api/sign/${token}/view`, { method: "POST" }).catch(() => undefined);
        setState("ready");
      } catch {
        setState("error");
      }
    }
    load();
  }, [token]);



  function collectFormResponses(): Array<{ name: string; value: string | boolean; type: string }> {
    const doc = reviewFrameRef.current?.contentDocument;
    if (!doc) return [];
    const fields = Array.from(doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
    return fields
      .filter((field) => field.name || field.id)
      .map((field) => {
        const key = field.name || field.id || "field";
        if (field instanceof HTMLInputElement && field.type === "checkbox") {
          return { name: key, value: field.checked, type: field.type };
        }
        if (field instanceof HTMLInputElement && field.type === "radio") {
          return { name: key, value: field.checked ? field.value : "", type: field.type };
        }
        return { name: key, value: field.value, type: field instanceof HTMLInputElement ? field.type : field.tagName.toLowerCase() };
      })
      .filter((f) => !(f.type === "radio" && f.value === ""));
  }

  async function complete() {
    const signatureData = mode === "typed" ? typedName.trim() : drawnSig;
    if (!signatureData || !agreed) return;
    setSubmitting(true);
    const formResponses = collectFormResponses();
    const res = await fetch(`/api/sign/${token}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signatureType: mode,
        signatureData,
        fullName: typedName.trim() || session?.recipientName || "Signer",
        formResponses,
      }),
    });
    setSubmitting(false);
    if (res.ok) setState("success");
    else alert("Signing failed. Please try again or contact Occu-Med.");
  }



  async function decline() {
    if (!declineReason.trim()) return;
    setDeclining(true);
    const res = await fetch(`/api/sign/${token}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: declineReason.trim() }),
    });
    setDeclining(false);
    if (res.ok) setState("declined");
    else alert("Decline request failed. Please try again.");
  }

  if (state === "loading") return <StatusPage state="loading" />;
  if (state !== "ready") return <StatusPage state={state} name={session?.recipientName} />;

  return (
    <div className="min-h-screen luminous-gradient p-4 md:p-8">
      <main className="tahoe-workspace mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-[#8dbeb5]/12 shadow-[0_0_30px_rgba(141,190,181,.18)]">
              <PenTool className="text-[#8dbeb5]" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8dbeb5]/70">Occu-Med</div>
              <div className="text-xl font-semibold text-white">Secure Document Signing</div>
            </div>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/65">
            <Lock size={13} className="mr-1 inline" /> No account required
          </div>
        </header>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.35em] text-[#8dbeb5]/75">Action Required</div>
            <h1 className="mt-2 text-4xl font-semibold text-white md:text-6xl">Review and sign your document</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Occu-Med has sent you a secure document request. Review the document, then apply your electronic signature.</p>
          </div>
          <div className="tahoe-panel rounded-[28px] p-5">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[#8dbeb5]/75">Recipient</div>
            <div className="mt-2 text-lg font-semibold text-white">{session?.recipientName}</div>
            <div className="text-sm text-white/55">{session?.recipientEmail}</div>
            <div className="mt-4 rounded-2xl bg-white/10 p-3 text-xs text-white/60">Request: <strong className="text-white">{session?.requestTitle}</strong></div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className={step === "review" ? "rounded-2xl border border-white/30 bg-[#8dbeb5] px-4 py-3 text-center text-sm font-semibold text-[#031219]" : "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/55"}>1. Review</div>
          <div className={step === "sign" ? "rounded-2xl border border-white/30 bg-[#8dbeb5] px-4 py-3 text-center text-sm font-semibold text-[#031219]" : "rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white/55"}>2. Sign</div>
        </div>

        {step === "review" ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div className="template-iframe-shell h-[70vh]">
              <iframe ref={reviewFrameRef} title="Document to sign" srcDoc={session?.documentContent ?? ""} sandbox="allow-forms allow-same-origin" />
            </div>
            <aside className="tahoe-panel flex flex-col justify-between rounded-[30px] p-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-[#8dbeb5]/75">Step 1</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Review packet</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">Review the document before continuing. Your signature will be recorded with a timestamp and audit trail.</p>
              </div>
              <button onClick={() => setStep("sign")} className="tahoe-button mt-6 rounded-2xl px-5 py-3 font-semibold">
                Continue <ChevronRight className="ml-1 inline" size={16} />
              </button>
            </aside>
          </section>
        ) : (
          <section className="mx-auto max-w-3xl">
            <div className="tahoe-panel rounded-[34px] p-6">
              <h2 className="flex items-center gap-3 text-3xl font-semibold text-white"><PenTool className="text-[#8dbeb5]" /> Apply your signature</h2>
              <div className="mt-5 inline-flex rounded-2xl border border-white/20 bg-white/10 p-1">
                <button onClick={() => setMode("typed")} className={mode === "typed" ? "rounded-xl bg-[#8dbeb5] px-4 py-2 text-sm font-semibold text-[#031219]" : "rounded-xl px-4 py-2 text-sm font-semibold text-white/60"}>Type</button>
                <button onClick={() => setMode("drawn")} className={mode === "drawn" ? "rounded-xl bg-[#8dbeb5] px-4 py-2 text-sm font-semibold text-[#031219]" : "rounded-xl px-4 py-2 text-sm font-semibold text-white/60"}>Draw</button>
              </div>
              <div className="mt-5">
                {mode === "typed" ? (
                  <input value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="Type your full legal name" className="w-full rounded-[24px] border border-white/25 bg-white/85 px-5 py-4 text-3xl text-[#031219] outline-none" style={{ fontFamily: "Georgia, serif" }} />
                ) : <SignatureCanvas onChange={setDrawnSig} />}
              </div>
              <label className="mt-5 flex items-start gap-3 rounded-[24px] border border-white/20 bg-white/10 p-4 text-sm leading-6 text-white/72">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
                <span>I agree to sign this document electronically and confirm the information provided is accurate.</span>
              </label>
              <div className="mt-6 rounded-2xl border border-white/15 bg-[#031219]/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8dbeb5]/80">Optional: Decline to sign</p>
                <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="Reason for decline" className="mt-2 w-full rounded-xl border border-white/20 bg-[#052a32]/70 p-3 text-sm text-[#f4f7f6] outline-none" rows={3} />
                <div className="mt-3 flex justify-end">
                  <button onClick={decline} disabled={declining || !declineReason.trim()} className="rounded-xl border border-red-300/30 bg-red-400/15 px-4 py-2 text-sm text-red-100 disabled:opacity-50">{declining ? "Declining..." : "Decline request"}</button>
                </div>
              </div>
              <div className="mt-6 flex justify-between gap-3">
                <button onClick={() => setStep("review")} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-white/70">Back</button>
                <button onClick={complete} disabled={submitting || !agreed || (mode === "typed" ? !typedName.trim() : !drawnSig)} className="tahoe-button rounded-2xl px-6 py-3 font-semibold disabled:opacity-50">{submitting ? "Signing..." : "Sign document"}</button>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="tahoe-panel rounded-[24px] p-4 text-sm text-white/65"><Shield className="mb-2 text-[#8dbeb5]" /> HIPAA audit trail recorded.</div>
          <div className="tahoe-panel rounded-[24px] p-4 text-sm text-white/65"><Lock className="mb-2 text-[#8dbeb5]" /> Secure token link. No portal account required.</div>
          <div className="tahoe-panel rounded-[24px] p-4 text-sm text-white/65"><CheckCircle className="mb-2 text-[#8dbeb5]" /> Signed PDF generated after completion.</div>
        </footer>
      </main>
    </div>
  );
}
