import { GoogleGenAI } from "@google/genai";

/**
 * Vercel Serverless Function — وسيط آمن لاستدعاء Gemini API.
 *
 * لماذا هذا الملف موجود؟
 * كان المفتاح (GEMINI_API_KEY) يُحقن سابقًا مباشرة داخل حزمة الجافاسكربت
 * التي تصل لمتصفح المستخدم (عبر vite.config.ts)، مما يعني أن أي شخص
 * يفتح "Inspect" في المتصفح يمكنه استخراج المفتاح واستخدامه.
 *
 * الحل: كل الاستدعاءات الآن تمر عبر هذا الملف الذي يعمل على خادم Vercel
 * فقط (لا يصل كوده أبدًا للمتصفح)، ويقرأ المفتاح من متغيرات البيئة على
 * Vercel مباشرة (GEMINI_API_KEY، بدون بادئة VITE_ حتى لا يتم تضمينه في
 * حزمة العميل تلقائيًا).
 *
 * الإعداد المطلوب على Vercel:
 * Project Settings → Environment Variables → أضف:
 *   الاسم:  GEMINI_API_KEY
 *   القيمة: مفتاحك الحقيقي من https://aistudio.google.com/apikey
 * (بدون بادئة VITE_ — هذا هو المقصود، حتى لا يُبنى داخل ملفات العميل)
 */

export const config = {
  runtime: "nodejs",
};

interface ChatPart {
  text: string;
}

interface ChatMessage {
  role: "user" | "model";
  parts: ChatPart[];
}

interface RequestBody {
  systemInstruction: string;
  contents: ChatMessage[];
}

export default async function handler(req: any, res: any) {
  // نسمح فقط بطلبات POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    res.status(500).json({
      error:
        "لم يتم إعداد مفتاح Gemini API على الخادم. أضِف GEMINI_API_KEY في إعدادات Vercel (Environment Variables).",
    });
    return;
  }

  try {
    const body: RequestBody = req.body;

    if (!body || !Array.isArray(body.contents)) {
      res.status(400).json({ error: "طلب غير صالح: contents مفقودة." });
      return;
    }

    // حد بسيط لحجم الطلب لمنع إساءة الاستخدام (تقريبًا 20 رسالة كحد أقصى)
    if (body.contents.length > 20) {
      res.status(400).json({ error: "عدد الرسائل يتجاوز الحد المسموح." });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model,
      contents: body.contents,
      config: {
        systemInstruction: body.systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const grounding_chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const grounding_urls =
      grounding_chunks
        ?.map((chunk: any) => ({
          uri: chunk.web?.uri,
          title: chunk.web?.title,
        }))
        .filter((u: any) => u.uri) || [];

    res.status(200).json({ text, grounding_urls });
  } catch (error: any) {
    console.error("Gemini proxy error:", error);
    res.status(500).json({
      error: "تعذر الاتصال بخوادم الذكاء الاصطناعي. حاول مرة أخرى لاحقًا.",
    });
  }
}
