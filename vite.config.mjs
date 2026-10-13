// Vite config for the 《追剧学汉语》 web app (separate from the Remotion Studio setup).
import { defineConfig } from "vite";
import { adminLoginPlugin } from "./server/viteAdminPlugin.ts";
import { youtubeCaptionsPlugin } from "./server/viteCaptionsPlugin.ts";

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic", importSource: "react" },
  },
  // 로컬 자막 API (/api/youtube/*), 관리자 로그인 확인 API (/api/admin/*) — npm run app 실행 시 함께 동작
  plugins: [youtubeCaptionsPlugin(), adminLoginPlugin()],
  server: { port: 5173, strictPort: true },
  // 배포(Railway) — npm start 가 vite preview 로 빌드 결과와 자막 API를 함께 서비스한다
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: [".railway.app", process.env.RAILWAY_PUBLIC_DOMAIN].filter(Boolean),
  },
  build: { outDir: "dist-app" },
});
