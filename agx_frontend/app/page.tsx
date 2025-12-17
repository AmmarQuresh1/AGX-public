"use client"; // If you're in the App Router

import { useState } from "react";
import { FiCopy } from "react-icons/fi";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

function CLICard() {
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Set to true if you’re sending marketing emails to UK users (UK GDPR/PECR opt‑in).
  const REQUIRE_UK_OPT_IN = true;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("https://formspree.io/f/mwpnagok", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });

      if (res.ok) {
        form.reset();
        setNotice({ type: "success", text: "Thanks! I’ll send you an email." });
      } else {
        setNotice({ type: "error", text: "Sorry, couldn’t submit. Please email cli@agx.run." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error. Please try again or email cli@agx.run." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl card">
      <h3 className="text-sm font-semibold">AGX CLI (private alpha)</h3>
      <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-subtle">
        <li><strong>Cloud Engine:</strong> Powered by a custom 12B model.</li>
        <li><strong>Local Execution:</strong> Your AWS credentials never leave your machine.</li>
        <li><strong>Open Source:</strong> Fully auditable CLI code (coming Q1).</li>
      </ul>

      <form onSubmit={handleSubmit} className="mt-3" style={{ display: "grid", gap: 8 }}>
        {/* honeypot to reduce spam */}
        <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

        {/* required email—single field for simplicity */}
        <label className="text-sm text-subtle">
          Work email
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            className="mt-1 w-full input"
          />
        </label>

        {/* optional UK marketing consent */}
        {REQUIRE_UK_OPT_IN && (
          <label className="flex items-start gap-2 text-sm text-subtle">
            <input type="checkbox" name="consent" required className="mt-1" />
            <span>I agree to receive emails about the AGX CLI private alpha.</span>
          </label>
        )}

        {/* context/segmentation */}
        <input type="hidden" name="source" value="agx.run_cli_card" />
        <input type="hidden" name="product" value="AGX CLI (private alpha)" />

    <button type="submit" disabled={submitting} className="rounded-md button" style={{ width: "fit-content", background: submitting ? "var(--accent)" : "var(--surface)" }}>
          {submitting ? "Submitting…" : "Join early list"}
        </button>

        {notice && (
          <p
            aria-live="polite"
            className="text-sm"
      style={{ color: notice.type === "success" ? "#0a7d3b" : "#b00020" }}
          >
            {notice.text}
          </p>
        )}
      </form>
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const MIN_SPINNER_MS = 2250; 

  const QUICK_PROMPTS = [
  "Create an S3 bucket named 'agx-assets' and save to infra.tf",
  "Deploy a private bucket called 'secure-logs'", 
  "Log 'Starting Job', create a bucket 'app-data', then log 'Done'",
  "Create two buckets: 'frontend' and 'backend' and save to main.tf"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stops reload
    setDownloading(true);
    setResult(""); // Clear previous result
    setProcessingStep(1);
    
    let apiResponse: any = null;
    let apiError: any = null;
    
    // Start the API call immediately but don't wait for it
    const apiCall = fetch("/api", { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    }).then(async (response) => {
      if (response.status == 429) {
        throw new Error("Rate limit reached: 5 plans per day. Please try again tomorrow.");
      }
      if (!response.ok) {
        let errorMsg = "Unknown error."
        try {
          const errorData = await response.json();
          if (errorData.detail) errorMsg = errorData.detail;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const code = await response.text();
      return code;
    }).then((code) => {
      apiResponse = code;
    }).catch((err) => {
      apiError = err;
    });
    
    // Show processing steps with guaranteed delays
    setTimeout(() => setProcessingStep(2), 750);  
    setTimeout(() => setProcessingStep(3), 1500);  
    
  // Wait for at least MIN_SPINNER_MS total before showing results
  setTimeout(async () => {
      // Ensure API call is complete
      await apiCall;
      
      if (apiError) {
        if (apiError.message.includes("Rate limit")) {
          alert(apiError.message);
        } else if (apiError instanceof Error) {
          alert(apiError.message);
        } else {
          alert("Failed to get code.");
        }
        setProcessingStep(0);
        setDownloading(false);
        return;
      }
      
      if (apiResponse) {
        setResult(apiResponse);
      }
      
      setProcessingStep(0); // Reset processing step
      setDownloading(false);
  }, MIN_SPINNER_MS);
  };

  const handleDownload = () => {
    if (!result) {
      alert("No code to download. Generate a script first!");
      return;
    }
    
    const blob = new Blob([result], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plan.py";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="main">
      <div className="container">
        {/* The logo is now in a div, not an H1. */}
        <div style={{ margin: 0, fontWeight: 'normal', fontSize: '1rem' }}>
          <img
            src="/resources/agx_white.png"
            alt="AGX: The Verifiable AI Workflow Engine for DevOps"
            className="logo-img"
          />
        </div>

        {/* Hero Section */}
        <div className="hero">
          <h1 className="hero-title">
            Verification First Terraform
          </h1>
          <p className="hero-lead">
            AGX uses static analysis to validate LLM-generated plans before execution. It compiles natural language into verified Terraform, ensuring type safety and logical correctness.
          </p>
            <p className="hero-sub">
            This web app shows an early prototype version of the engine. An updated version with advanced features will power an open-source CLI (Q1 2026).
            </p>
          <div className="hero-actions">
            <button
              onClick={() => {
                const toolSection = document.getElementById('tool-section');
                if (toolSection) {
                  toolSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="cta-btn"
            >
              Try the Web Demo
            </button>
            <a
              href="https://github.com/AmmarQuresh1/AGX-public"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn-secondary"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Tool Section */}
        <div id="tool-section">
          <h2 className="whitespace-normal md:whitespace-nowrap" style={{ marginBottom: 12, textAlign: "center" }}>
            Describe your infrastructure... 
          </h2>

          {/* Responsive form container */}
          <div className="prompt-form-container" style={{ width: "100%", maxWidth: "90%", margin: "0 auto" }}>
            <form onSubmit={handleSubmit} className="prompt-form" style={{ marginTop: 8, justifyContent: "center" }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={"Create an S3 bucket and save to main.tf"}
                className="prompt-input input"
                style={{ padding: 12, fontSize: "1.2rem" }}
              />
              <button
                type="submit"
                disabled={downloading || !prompt}
                className="prompt-btn button"
                style={{ padding: "12px 24px", fontSize: "1.2rem", whiteSpace: "nowrap", background: downloading ? "var(--accent)" : "var(--surface)" }}
              >
                {downloading ? "Generating..." : "Generate Script"}
              </button>
            </form>
          </div>

          {/* ADD THIS SECTION: Quick Prompt Chips */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginTop: "1rem" }}>
          {QUICK_PROMPTS.map((text, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(text)}
              style={{
                fontSize: "0.85rem",
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid var(--accent)",
                background: "transparent",
                color: "var(--foreground)", // Adjust based on your theme
                cursor: "pointer",
                opacity: 0.8,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.8";
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--foreground)";
              }}
            >
              {text}
            </button>
          ))}
        </div>

          <h2 style={{ marginTop: 32, marginBottom: 8, fontSize: "2rem" }}>
          Python to TF Script
          </h2>
          {/* PREFORMATTED BOX */}
          <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
            <pre
              role="status"
              aria-live="polite"
              aria-busy={downloading ? "true" : "false"}
              className="pre-box"
            >
              {downloading && processingStep > 0 ? (
                processingStep === 1 ? "[1/3] Generating plan…" :
                processingStep === 2 ? "[2/3] Validating plan correctness…" :
                "[3/3] Compiling into runnable script…"
              ) : result}
            </pre>
            <button
              type="button"
              title={copied ? "Copied!" : "Copy to clipboard"}
              aria-label="Copy output to clipboard"
              onClick={() => {
                if (result) {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 800);
                }
              }}
              className={`copy-btn ${copied ? 'copied' : ''}`}
              style={{ opacity: result ? 1 : 0.5, pointerEvents: result ? 'auto' : 'none' }}
              disabled={!result}
            >
              <FiCopy size={20} />
            </button>
          </div>
          <button
            type="button"
            title={!result ? "Generate a script first" : "Download the generated script"}
            onClick={handleDownload}
            disabled={!result}
            className="button"
            style={{ padding: "12px 24px", fontSize: "1.2rem", width: "100%", background: !result ? "var(--surface)" : "var(--accent)", color: !result ? "#999" : "#000" }}
          >
            Download Script
          </button>
          </div>
        </div>

        {/* New parent container for centering and constraining width */}
  <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "0 1rem", marginTop: 16 }}>
          <h2 style={{
            textAlign: "center",
            marginBottom: 32,
            marginTop: 48
          }}>
            About the Engine
          </h2>
          
          {/* Responsive two-column container */}
      <div
            className="roadmap-container"
            style={{
              maxWidth: 1000,
              fontFamily: "sans-serif",
              borderTop: "1px solid #e5e7eb",
              marginTop: "2rem",
              paddingTop: "2rem",
              gap: "2rem",
        display: "flex",
            }}
          >
            {/* Left Column: About the Engine */}
            <div style={{ flex: 1.5, paddingLeft: 10 }}>
              
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.5rem" }}>
                  Live in this Demo:
                </h4>
                <p className="text-subtle" style={{ lineHeight: 1.6, marginBottom: "1rem" }}>
                  Uses a <strong>deterministic validation stage</strong> to enforce strict type safety. The engine checks every step against a function registry to prevent hallucinated parameters or invalid dependencies.
                </p>

                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.5rem" }}>
                  Open Source CLI (Q1 2026):
                </h4>
                <p className="text-subtle" style={{ lineHeight: 1.6 }}>
                  Evolving into a <strong>graph-based execution engine</strong> powered by a custom lightweight model.
                </p>
              </div>
              
              <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Available tools (demo subset):</h4>
              <ul style={{ paddingLeft: "1.25rem", listStyle: "disc", lineHeight: 1.6, fontSize: "0.95rem" }} className="text-subtle">
                <li><code>set_bucket_name</code></li>
                <li><code>create_aws_s3_bucket</code></li>
                <li><code>aws_s3_bucket_public_access_block</code></li>
                <li><code>save_hcl_to_file</code></li>
                <li><code>sanitise_resource_name</code></li>
                <li><code>combine_two_hcl_blocks</code></li>
              </ul>
            </div>
            {/* Right Column: The Future */}
            <div style={{ flex: 1, paddingLeft: 20 }}>
              <CLICard />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <p className="footer-blurb" style={{ fontSize: "0.9rem", marginTop: "2rem" }}>
          Demo limited to 5 generations/day.
        </p>
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <a 
            href="https://www.linkedin.com/in/ammar-qureshi-083831274" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--subtle)", textDecoration: "underline" }}
          >
            Built by Ammar Qureshi, Founder of AGX
          </a>
        </div>
        <p className="footer-line" style={{ fontSize: "0.75rem", marginTop: "1rem" }}>
          AGX™ is a product of AQ DIGITAL LIMITED <br/>
          In the UK, AGX is offered under the mark AQ DIGITAL AGX™
        </p>
        <SpeedInsights />
        <Analytics />
      </main>
  );
}