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

  const signup =
    async () => {
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
              "pointer",
          }}
        >
          Sign Up
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

export default Signup;