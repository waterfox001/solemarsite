import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";

/**
 * Autenticação Administrativa Segura da Sol & Mar Rent a Car.
 *
 * Executada exclusivamente no ambiente de servidor (Node.js/runtime).
 * As credenciais oficiais do proprietário nunca são expostas em bundles do cliente
 * nem em arquivos públicos de frontend.
 *
 * A senha inicial autorizada é validada exclusivamente por comparação de hash SHA-256.
 */
const OWNER_PASSWORD_HASH = "6b4febbbb829331c75bbd78e3622b939f23cc28c73f38d6b777e43195a6028d9";

// E-mails autorizados definidos pelo proprietário
const AUTHORIZED_EMAILS = ["admn@solemar.com", "admin@solemar.com"];

export const verifyAdminCredentials = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const inputEmail = (data?.email || "").trim().toLowerCase();
    const inputPassword = data?.password || "";

    const hash = crypto.createHash("sha256").update(inputPassword).digest("hex");
    const isEmailValid = AUTHORIZED_EMAILS.includes(inputEmail);
    const isPasswordValid = hash === OWNER_PASSWORD_HASH;

    if (!isEmailValid || !isPasswordValid) {
      throw new Error("E-mail ou senha inválidos.");
    }

    return {
      authenticated: true,
      email: inputEmail,
      timestamp: Date.now(),
    };
  });
