import React, { useState, useCallback, useRef } from 'react';
import { analyzeCompassImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { CompassIcon } from './components/CompassIcon';
import { UploadIcon } from './components/UploadIcon';
import { SparklesIcon } from './components/SparklesIcon';
import { Spinner } from './components/Spinner';
import { DownloadIcon } from './components/DownloadIcon';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isStreamingComplete, setIsStreamingComplete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('الرجاء اختيار ملف صورة صالح.');
        return;
      }
      
      setImageFile(file);
      setAnalysis('');
      setError('');
      setIsStreamingComplete(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError('الرجاء اختيار صورة أولاً.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysis('');
    setIsStreamingComplete(false);

    try {
      const base64Data = await fileToBase64(imageFile);
      const stream = await analyzeCompassImage(base64Data, imageFile.type);
      
      for await (const chunk of stream) {
        setAnalysis((prev) => prev + chunk.text);
      }
      
      setIsStreamingComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      setError(`فشل التحليل: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleReset = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(null);
    setAnalysis('');
    setError('');
    setIsStreamingComplete(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);
  
  const handleDownload = useCallback(() => {
      if (!analysis) return;
      const blob = new Blob([analysis], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'تحليل_أداء_المربية.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }, [analysis]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <CompassIcon className="w-12 h-12 text-teal-400" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">
            محلل بوصلة أداء المربيات
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          ارفع صورة لبوصلة الأداء واحصل على تحليل للأدوار الوظيفية حسب نظرية بلبن
        </p>
      </header>

      <main className="w-full max-w-4xl bg-slate-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Image Upload and Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-900/60 p-6 rounded-xl border-2 border-dashed border-slate-600 transition-all duration-300 hover:border-teal-400 h-full">
            {previewUrl ? (
              <div className="w-full text-center">
                <img
                  src={previewUrl}
                  alt="معاينة بوصلة الأداء"
                  className="max-h-64 w-auto mx-auto rounded-lg shadow-lg mb-4 object-contain"
                />
                 <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  إزالة الصورة
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <UploadIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                >
                  اختر صورة
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </label>
                <p className="text-xs mt-1">PNG, JPG, WEBP, GIF</p>
              </div>
            )}
          </div>

          {/* Analysis Section */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleAnalyzeClick}
              disabled={!imageFile || isLoading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-sky-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5" />
                  <span>جاري التحليل...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  <span>حلل الصورة</span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-4 text-center">
                <p>{error}</p>
              </div>
            )}
            
            <div className="bg-slate-900/60 rounded-xl min-h-[200px] border border-slate-700 flex flex-col transition-all duration-300">
              <div className="flex justify-between items-center p-4 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-slate-300">نتائج التحليل:</h2>
                  {analysis && isStreamingComplete && (
                      <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-3 py-1.5 bg-sky-600/80 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="تحميل التحليل"
                          disabled={!analysis || isLoading}
                      >
                          <DownloadIcon className="w-4 h-4" />
                          <span>تحميل</span>
                      </button>
                  )}
              </div>
              <div className="p-4 flex-grow">
                {isLoading && !analysis ? (
                  <div className="flex items-center justify-center h-full pt-10">
                      <p className="text-slate-400">يرجى الانتظار...</p>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-invert prose-p:text-slate-300 prose-strong:text-teal-300 whitespace-pre-wrap max-w-none">
                    {analysis}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-center pt-10">
                    ستظهر نتائج تحليل بوصلة الأداء هنا.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>
          مدعوم بواسطة Gemini API
        </p>
      </footer>
    </div>
  );
};

export default App;