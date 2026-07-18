import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>FoodMap</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 18, lineHeight: 1.5 }}>
        Discover restaurants you&rsquo;re about to pass — while driving, riding, or walking.
      </p>
      <Link
        href="/foodmap"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "14px 20px",
          borderRadius: 999,
          background: "var(--brand)",
          color: "var(--on-brand)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Open FoodMap
      </Link>
    </main>
  );
}
