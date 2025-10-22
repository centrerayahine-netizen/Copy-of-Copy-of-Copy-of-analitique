import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analyzes an image of a nanny's performance compass using a streaming response.
 * @param base64ImageData The base64 encoded image data.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @returns An async iterable stream of `GenerateContentResponse` containing the analysis from the Gemini model.
 */
export const analyzeCompassImage = async (base64ImageData: string, mimeType: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };

    const textPart = {
      text: `أنت خبير في تحليل أداء الموظفين ومتخصص في نظرية أدوار فريق بلبن (Belbin Team Roles). أمامك صورة لـ 'بوصلة أداء' خاصة بمربية تعمل في مركز لذوي الاحتياجات الخاصة. قم بتحليل هذه الصورة بدقة. بناءً على البيانات والتقييمات الموجودة في الصورة، قم بما يلي:
1. لخص نقاط القوة والضعف الرئيسية للمربية في نقاط واضحة.
2. حدد أي من أدوار فريق بلبن التسعة (مثل المنفذ، المنسق، المفكر، المستكشف، إلخ) هو الأنسب لهذه المربية. يمكن تحديد دور أساسي ودور ثانوي.
3. قدم تبريرًا واضحًا لاختيارك للأدوار، مع ربطها بالبيانات المرئية في بوصلة الأداء.
4. اقترح توصيات عملية ومحددة لتطوير أداء المربية بناءً على تحليل الأدوار.`,
    };

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    
    return responseStream;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while calling the Gemini API.");
  }
};