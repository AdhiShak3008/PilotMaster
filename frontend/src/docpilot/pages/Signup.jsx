import { useState } from "react";

import { apiRequest } from "../api";

function Signup({
  goToLogin,
}) {
  const [username,
    setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");
  const [loading,
    setLoading] =
    useState(false);

  const signup =
    async () => {
      if (loading) return;
      setLoading(true);
      try {
        await apiRequest(
          "/auth/signup",
          "POST",
          {
            username,
            email,
            password,
          }
        );

        alert(
          "Signup successful"
        );

        goToLogin();

      } catch (error) {
        console.error(error);

        alert(
          "Signup failed"
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
          width: "420px",
          maxWidth: "90vw",
        }}
      >
        <h1
          style={{
            fontSize:
              "64px",

            marginBottom:
              "40px",

            letterSpacing:
              "-3px",

            color: "white",
          }}
        >
          DocPilot
        </h1>

        <input
          placeholder="Username"

          value={username}

          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }

          style={{
            width: "100%",

            padding:
              "18px",

            marginBottom:
              "16px",

            borderRadius:
              "14px",

            border:
              "1px solid #333",

            background:
              "#1d1d1d",

            color:
              "white",

            fontSize:
              "16px",

            outline:
              "none",
          }}
        />

        <input
          placeholder="Email"

          value={email}

          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }

          style={{
            width: "100%",

            padding:
              "18px",

            marginBottom:
              "16px",

            borderRadius:
              "14px",

            border:
              "1px solid #333",

            background:
              "#1d1d1d",

            color:
              "white",

            fontSize:
              "16px",

            outline:
              "none",
          }}
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

          style={{
            width: "100%",

            padding:
              "18px",

            marginBottom:
              "20px",

            borderRadius:
              "14px",

            border:
              "1px solid #333",

            background:
              "#1d1d1d",

            color:
              "white",

            fontSize:
              "16px",

            outline:
              "none",
          }}
        />

        <button
          onClick={signup}

          disabled={loading}

          style={{
            width: "100%",

            padding:
              "18px",

            borderRadius:
              "14px",

            border:
              "1px solid #333",

            background:
              "#2a2a2a",

            color:
              "white",

            fontSize:
              "16px",

            cursor:
              loading ? "not-allowed" : "pointer",

            opacity:
              loading ? 0.7 : 1,

            transition:
              "opacity 0.15s",
          }}
        >
          {loading ? <ButtonContent text="Loading..." /> : "Sign Up"}
        </button>

        <p
          style={{
            marginTop:
              "20px",

            color: "#888",

            textAlign:
              "center",

            cursor:
              "pointer",
          }}

          onClick={
            goToLogin
          }
        >
          Already have an account?
          Login
        </p>
      </div>
    </div>
  );
}

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

export default Signup;
