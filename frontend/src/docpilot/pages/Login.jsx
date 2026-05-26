import { useState } from "react";

import { loginRequest } from "../api";

function Login({
  onLogin,
  goToSignup,
  goToForgot,
}) {

  const [email,
    setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");
  const [loading,
    setLoading] =
    useState(false);

  const login =
    async () => {
      if (loading) return;
      setLoading(true);

      try {

        const data =
          await loginRequest(
            email,
            password
          );

        if (
          !data.access_token
        ) {

          alert(
            "Invalid credentials"
          );

          return;
        }

        localStorage.setItem(
          "token",
          data.access_token
        );

        await onLogin();

      } catch (error) {

        console.error(error);

        alert(
          "Wrong email or password"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      style={{
        width: "100vw",

        height: "100vh",

        background:
          "#111",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        overflow:
          "hidden",
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth:
            "520px",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          padding:
            "24px",

          boxSizing:
            "border-box",
        }}
      >

        <h1
          style={{
            fontSize:
              "72px",

            fontFamily:
              "Georgia, serif",

            fontWeight:
              "600",

            marginBottom:
              "36px",

            letterSpacing:
              "-2px",

            color:
              "white",

            lineHeight:
              "1",

            textAlign:
              "center",
          }}
        >
          DocPilot
        </h1>

        <input
          placeholder="Email"

          value={email}

          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }

          style={inputStyle}
        />

        <input
          type="password"

          placeholder="Password"

          value={password}

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }

          style={inputStyle}
        />

        <button
          onClick={login}

          disabled={loading}

          style={{
            ...buttonStyle,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? <ButtonContent text="Loading..." /> : "Login"}
        </button>

        <p
          onClick={
            goToSignup
          }

          style={{
            marginTop:
              "22px",

            color:
              "#888",

            textAlign:
              "center",

            cursor:
              "pointer",

            fontWeight:
              "600",

            fontSize:
              "18px",
          }}
        >
          Don't have an account?
          {" "}
          Sign up
        </p>

        <p
          onClick={
            goToForgot
          }

          style={{
            marginTop:
              "14px",

            color:
              "#666",

            textAlign:
              "center",

            cursor:
              "pointer",

            fontWeight:
              "600",

            fontSize:
              "16px",
          }}
        >
          Forgot password?
        </p>

      </div>
    </div>
  );
}

const inputStyle = {
  width: "520px",

  maxWidth:
    "90vw",

  padding:
    "22px",

  marginBottom:
    "18px",

  borderRadius:
    "18px",

  border:
    "1px solid #2e2e2e",

  background:
    "#1d1d1d",

  color:
    "white",

  fontSize:
    "18px",

  outline:
    "none",

  boxSizing:
    "border-box",
};

const buttonStyle = {
  width: "520px",

  maxWidth:
    "90vw",

  padding:
    "22px",

  borderRadius:
    "18px",

  border:
    "1px solid #333",

  background:
    "#2a2a2a",

  color:
    "white",

  fontSize:
    "18px",

  cursor:
    "pointer",

  fontWeight:
    "700",

  boxSizing:
    "border-box",
};

function Spinner({ size = 16 }) {
  return (
    <span style={{
      width: `${size}px`,
      height: `${size}px`,
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      borderRadius: "999px",
      display: "inline-block",
      animation: "pilot-spin 0.8s linear infinite",
    }} />
  );
}

function ButtonContent({ text }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <Spinner /> {text}
    </span>
  );
}

export default Login;
