"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#f5f1e8",
          color: "#1f1c18",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 720, width: "100%" }}>
          <h1 style={{ marginTop: 0 }}>Agentic AI Atlas</h1>
          <p>The interface hit an unexpected error.</p>
          {error.digest ? <p>Error digest: {error.digest}</p> : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: "1px solid #1f1c18",
              borderRadius: 999,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              padding: "0.7rem 1rem",
            }}
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
