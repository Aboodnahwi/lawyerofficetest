import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    // ملاحظة: تم حذف حقن GEMINI_API_KEY هنا عمدًا. المفتاح لم يعد يُستخدم
    // في الواجهة الأمامية إطلاقًا — تتم كل الاستدعاءات عبر api/gemini-chat.ts
    // الذي يعمل على الخادم فقط ويقرأ المفتاح من متغيرات بيئة Vercel مباشرة.
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
