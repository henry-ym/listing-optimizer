import React from "react";

export default function PricingPage() {
  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>Pricing</h1>
      <div
        style={{
          display: "flex",
          gap: 32,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch"
        }}
      >
        {/* Free Plan */}
        <div
          style={{
            flex: 1,
            border: "1px solid #eaeaea",
            borderRadius: 10,
            padding: 32,
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)"
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Free</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>$0</div>
          <div style={{ color: "#555", marginBottom: 24 }}>per month</div>
          <ul style={{ paddingLeft: 20, marginBottom: 28 }}>
            <li>Basic listing optimization</li>
            <li>Keyword suggestions</li>
            <li>Email support</li>
          </ul>
          <button
            disabled
            style={{
              width: "100%",
              padding: "12px 0",
              border: "none",
              borderRadius: 6,
              backgroundColor: "#f3f3f3",
              color: "#888",
              fontWeight: 600,
              cursor: "not-allowed"
            }}
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div
          style={{
            flex: 1,
            border: "2px solid #1b72ea",
            borderRadius: 10,
            padding: 32,
            boxShadow: "0 4px 16px 0 rgba(16, 86, 210, 0.07)"
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: "#1b72ea" }}>Pro</h2>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>$29</div>
          <div style={{ color: "#555", marginBottom: 24 }}>per month</div>
          <ul style={{ paddingLeft: 20, marginBottom: 28 }}>
            <li>All Free features</li>
            <li>Advanced optimization tools</li>
            <li>Export to CSV</li>
            <li>Priority chat support</li>
          </ul>
          <a
            href="https://www.creem.io/test/payment/prod_4y6VNxRW0tLyqwpYUH5Cip"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "12px 0",
              textAlign: "center",
              borderRadius: 6,
              backgroundColor: "#1b72ea",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 16,
              letterSpacing: 0.2
            }}
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  );
}
