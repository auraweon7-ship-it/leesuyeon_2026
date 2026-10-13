// Vite 개발/미리보기 서버에 관리자 로그인 확인 API를 붙이는 플러그인.
// 비밀번호는 서버 환경변수 ADMIN_PASSWORD 로만 두고 브라우저 번들에는 넣지 않는다.
//
//   POST /api/admin/login   { "password": "..." }
//     200 { ok: true } / 401 { ok: false } / 503 (ADMIN_PASSWORD 미설정)
//
// 주의: 비밀번호 확인만 서버에서 한다. 로그인 이후 화면 접근 제어는 여전히 브라우저에서 이루어진다.

import { createHash, timingSafeEqual } from "node:crypto";
import { loadEnv, type Connect, type Plugin } from "vite";

const MAX_BODY_BYTES = 2048;
/** 틀린 비밀번호 응답을 늦춰 무차별 대입을 느리게 한다. */
const FAIL_DELAY_MS = 800;

const digest = (text: string) => createHash("sha256").update(text).digest();

const sendJson = (res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readBody = (req: Parameters<Connect.NextHandleFunction>[0]) =>
  new Promise<string>((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("too-large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const createHandler =
  (getPassword: () => string): Connect.NextHandleFunction =>
  (req, res, next) => {
    const route = (req.url ?? "/").split("?")[0].replace(/\/+$/, "");
    if (route !== "/login") return next();
    if (req.method !== "POST") return sendJson(res, 405, { ok: false });

    const expected = getPassword();
    if (!expected) return sendJson(res, 503, { ok: false, code: "not-configured" });

    readBody(req)
      .then((raw) => {
        const password = (JSON.parse(raw) as { password?: unknown }).password;
        if (typeof password === "string" && timingSafeEqual(digest(password), digest(expected))) {
          sendJson(res, 200, { ok: true });
        } else {
          setTimeout(() => sendJson(res, 401, { ok: false }), FAIL_DELAY_MS);
        }
      })
      .catch(() => sendJson(res, 400, { ok: false }));
  };

export const adminLoginPlugin = (): Plugin => {
  let password = "";
  const handler = createHandler(() => password);
  return {
    name: "zhuiju-admin-login",
    configResolved(config) {
      // .env 파일과 실제 환경변수(Railway Variables)를 모두 읽는다.
      password = (loadEnv(config.mode, config.envDir || config.root, "").ADMIN_PASSWORD ?? "").trim();
    },
    configureServer(server) {
      server.middlewares.use("/api/admin", handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/admin", handler);
    },
  };
};
