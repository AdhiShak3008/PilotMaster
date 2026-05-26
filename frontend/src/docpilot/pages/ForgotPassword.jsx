import { useState } from "react";

import { apiRequest } from "../api";

function ForgotPassword({
  goBack,
}) {
  const [email,
    setEmail] =
    useState("");

  const [token,
    setToken] =
    useState("");

  const [newPassword,
    setNewPassword] =
    useState("");

  const [generatedToken,
    setGeneratedToken] =
    useState("");

  const requestReset =
    async () => {

      try {

        const data =
          await apiRequest(
            "/auth/forgot-password",
            "POST",
            {
              email,
            }
          );

        setGeneratedToken(
          data.reset_token
        );

      } catch (error) {

        console.error(error);

        alert(
          "Email not found"
        );
      }
    };

  const resetPassword =
    async () => {

      try {

        await apiRequest(
          "/auth/reset-password",
          "POST",
          {
            token,
            new_password:
              newPassword,
          }
        );

        alert(
          "Password reset successful"
        );

        goBack();

      } catch (error) {

        console.error(error);

        alert(
          "Invalid token"
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

            fontWeight:
              "900",

            color:
              "white",

            marginBottom:
              "40px",
          }}
        >
          Reset
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

        <button
          onClick={
            requestReset
          }

          style={buttonStyle}
        >
          Generate Reset Token
        </button>

        {generatedToken && (
          <div
            style={{
              color:
                "#aaa",

              marginTop:
                "20px",

              wordBreak:
                "break-all",
            }}
          >
            Reset Token:
            <br />
            {
              generatedToken
            }
          </div>
        )}

        <input
          placeholder="Paste Token"

          value={token}

          onChange={(e) =>
            setToken(
              e.target.value
            )
          }

          style={{
            ...inputStyle,
            marginTop:
              "20px",
          }}
        />

        <input
          type="password"

          placeholder="New Password"

          value={newPassword}

          onChange={(e) =>
            setNewPassword(
              e.target.value
            )
          }

          style={inputStyle}
        />

        <button
          onClick={
            resetPassword
          }

          style={buttonStyle}
        >
          Reset Password
        </button>

        <p
          onClick={goBack}

          style={{
            marginTop:
              "20px",

            color:
              "#777",

            cursor:
              "pointer",

            textAlign:
              "center",
          }}
        >
          Back to Login
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",

  padding: "18px",

  marginBottom: "16px",

  borderRadius: "14px",

  border: "1px solid #333",

  background: "#1d1d1d",

  color: "white",

  fontSize: "16px",

  outline: "none",
};

const buttonStyle = {
  width: "100%",

  padding: "18px",

  borderRadius: "14px",

  border: "1px solid #333",

  background: "#2a2a2a",

  color: "white",

  fontSize: "16px",

  cursor: "pointer",
};

export default ForgotPassword;