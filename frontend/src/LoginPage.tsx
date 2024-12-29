import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import cryptoJS from "crypto-js";

interface FormData {
  idPC: string;
  name: string;
  password: string;
  idLab: string;
}

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const [loginError, setLoginError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (isAuthenticated === "true") {
      navigate("/chat"); // Se autenticato, reindirizza alla pagina di chat
    }
  }, [navigate]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (data.idPC && data.name && data.password && data.idLab) {
      const hashedPassword = cryptoJS.SHA256(data.password).toString();

      const response = await fetch("http://localhost:3000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `${data.idPC}${data.name}${data.idLab}`,
          password: hashedPassword,
        }),
      });

      if (response.ok) {
        localStorage.setItem("isAuthenticated", "true");
        const now = new Date();
        localStorage.setItem(
          "idSession",
          `${data.idPC}${data.name}${data.idLab}-${now.getDate()}${
            now.getMonth() + 1
          }`
        );

        navigate("/chat");
      } else {
        setLoginError("Qualcosa è andato storto");
      }
    } else {
      setLoginError(
        "Credenziali errate. Controlla numero PC, id LAB, nome o password."
      );
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Numero PC:</label>
          <input
            {...register("idPC", { required: "Numero PC obbligatorio" })}
            placeholder="Inserisci il numero PC"
            style={styles.input}
          />
          {errors.idPC && (
            <span style={styles.error}>{errors.idPC.message}</span>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Laboratorio:</label>
          <input
            {...register("idLab", { required: "Id laboratorio obbligatorio" })}
            placeholder="Inserisci l'identificativo del laboratorio"
            style={styles.input}
          />
          {errors.idLab && (
            <span style={styles.error}>{errors.idLab.message}</span>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nome:</label>
          <input
            {...register("name", { required: "Nome obbligatorio" })}
            placeholder="Inserisci il nome"
            style={styles.input}
          />
          {errors.name && (
            <span style={styles.error}>{errors.name.message}</span>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password:</label>
          <input
            type="password"
            {...register("password", { required: "Password obbligatoria" })}
            placeholder="Inserisci la password"
            style={styles.input}
          />
          {errors.password && (
            <span style={styles.error}>{errors.password.message}</span>
          )}
        </div>

        {loginError && <div style={styles.error}>{loginError}</div>}

        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
};

// Stili CSS in JS
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    marginTop: "50px",
  },
  form: {
    width: "300px",
    display: "flex",
    flexDirection: "column",
  },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  label: {
    width: "100px", // Larghezza fissa per allineare le etichette
    textAlign: "right", // Allinea il testo delle etichette a destra
    marginRight: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "12px",
    marginTop: "5px",
  },
};

export default LoginPage;
