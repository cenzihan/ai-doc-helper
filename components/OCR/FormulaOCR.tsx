
import React, { useState, useRef, useCallback } from 'react';
import { Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { getModelConfig } from '../../utils/settings';
import { generateContent } from '../../utils/aiHelper';

interface FormulaOCRProps {
  onResult: (text: string) => void;
}

interface FormulaResult {
  inline: string;
  block: string;
  raw: string;
  html: string;
}

interface TableResult {
  markdown: string;
  html: string;
}

interface HandwritingResult {
  markdown: string;
  html: string;
}

type OCRMode = 'formula' | 'table' | 'handwriting';

const FormulaOCR: React.FC<FormulaOCRProps> = ({ onResult }) => {
  const [mode, setMode] = useState<OCRMode>('formula');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Results State
  const [formulaResult, setFormulaResult] = useState<FormulaResult | null>(null);
  const [tableResult, setTableResult] = useState<TableResult | null>(null);
  const [handwritingResult, setHandwritingResult] = useState<HandwritingResult | null>(null);
  
  // UI State
  const [activeFormulaTab, setActiveFormulaTab] = useState<'block' | 'inline' | 'raw' | 'html'>('block');
  const [activeTableTab, setActiveTableTab] = useState<'preview' | 'markdown' | 'html'>('preview');
  const [activeHandwritingTab, setActiveHandwritingTab] = useState<'preview' | 'markdown' | 'html'>('preview');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 图片压缩处理函数
  const processImage = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 限制最大尺寸为 1600px，兼顾清晰度和体积
                const MAX_DIMENSION = 1600;
                
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                
                // 绘制并压缩为 JPEG
                ctx.drawImage(img, 0, 0, width, height);
                // 0.8 质量通常足够 OCR 使用且体积很小
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(compressedDataUrl);
            };
            img.onerror = (e) => reject(e);
            img.src = event.target?.result as string;
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          try {
            const compressedImage = await processImage(blob);
            setImage(compressedImage);
            resetResults();
          } catch (err) {
            console.error("Image processing failed", err);
            alert("图片处理失败");
          }
        }
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressedImage = await processImage(file);
            setImage(compressedImage);
            resetResults();
        } catch (err) {
            console.error("Image processing failed", err);
            alert("图片处理失败");
        }
    }
    if (e.target) e.target.value = '';
  };

  const resetResults = () => {
    setFormulaResult(null);
    setTableResult(null);
    setHandwritingResult(null);
  };

  // Helper to safely extract JSON from AI response
  const parseJsonSafe = (text: string) => {
      let clean = text.trim();
      
      // 1. Try to extract from markdown code blocks
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)(?:```|$)/;
      const match = clean.match(codeBlockRegex);
      if (match && match[1]) {
          clean = match[1].trim();
      }

      // 2. If no code block or extraction failed, try finding the outer braces
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
          clean = clean.substring(start, end + 1);
      }

      try {
          return JSON.parse(clean);
      } catch (e) {
          console.error("JSON Parse Error. Raw text:", text, "Cleaned text:", clean);
          throw new Error("Invalid JSON structure in response.");
      }
  };

  // 1. 生成数学公式示例图片
  const createFormulaSampleImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 300);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px Helvetica, Arial, sans-serif';
    ctx.fillText('Sample: Quadratic Formula', 20, 40);

    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;

    ctx.font = 'italic 40px "Times New Roman", serif';
    ctx.fillText('x =', 60, 160);

    ctx.beginPath();
    ctx.moveTo(130, 148);
    ctx.lineTo(440, 148);
    ctx.stroke();

    ctx.font = 'italic 36px "Times New Roman", serif';
    ctx.fillText('-b ±', 145, 125);

    ctx.beginPath();
    ctx.moveTo(235, 105);
    ctx.lineTo(250, 135); 
    ctx.lineTo(265, 85);  
    ctx.lineTo(430, 85);  
    ctx.stroke();

    ctx.fillText('b', 280, 125);
    ctx.font = 'italic 22px "Times New Roman", serif';
    ctx.fillText('2', 300, 105);
    ctx.font = 'italic 36px "Times New Roman", serif';
    ctx.fillText('- 4ac', 320, 125);

    ctx.fillText('2a', 265, 200);

    return canvas.toDataURL('image/png');
  };

  // 2. 生成表格示例图片
  const createTableSampleImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 500);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Helvetica, Arial, sans-serif';
    ctx.fillText('Nutrition Facts', 20, 50);
    ctx.font = '24px "Noto Sans SC", sans-serif';
    ctx.fillText('营养成分表', 20, 85);

    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(20, 100);
    ctx.lineTo(580, 100);
    ctx.stroke();

    ctx.lineWidth = 1;
    let y = 140;
    const drawRow = (label: string, value: string, bold = false) => {
        ctx.font = bold ? 'bold 20px sans-serif' : '20px sans-serif';
        ctx.fillText(label, 20, y);
        ctx.fillText(value, 450, y);
        
        ctx.beginPath();
        ctx.moveTo(20, y + 10);
        ctx.lineTo(580, y + 10);
        ctx.strokeStyle = '#cccccc';
        ctx.stroke();
        y += 40;
    };

    drawRow('Serving Size (食用分量)', '100g', true);
    drawRow('Calories (能量)', '2000 kJ', true);
    
    y -= 25;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(20, y + 10);
    ctx.lineTo(580, y + 10);
    ctx.stroke();
    y += 40;

    drawRow('Total Fat (脂肪)', '15 g', true);
    drawRow('   Saturated Fat (饱和脂肪)', '2 g');
    drawRow('Cholesterol (胆固醇)', '0 mg', true);
    drawRow('Sodium (钠)', '160 mg', true);
    drawRow('Total Carbohydrate (碳水)', '45 g', true);

    y += 20;
    ctx.font = '14px sans-serif';
    ctx.fillText('* The % Daily Value (DV) tells you how much a nutrient in', 20, y);
    ctx.fillText('a serving of food contributes to a daily diet.', 20, y + 20);

    return canvas.toDataURL('image/png');
  };

  // 3. 生成手写体示例图片（模拟黄色便签）
  const createHandwritingSampleImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 黄色便签背景
    ctx.fillStyle = '#fef3c7'; // amber-100
    ctx.fillRect(0, 0, 500, 500);

    // 绘制横线
    ctx.strokeStyle = '#d4d4d8'; // zinc-300
    ctx.lineWidth = 1;
    for (let i = 80; i < 500; i += 40) {
        ctx.beginPath();
        ctx.moveTo(20, i);
        ctx.lineTo(480, i);
        ctx.stroke();
    }

    // 模拟手写字体
    ctx.fillStyle = '#1e3a8a'; // blue-900 (模拟钢笔墨水)
    ctx.font = '28px "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif'; // 使用手写风格字体
    
    // 内容
    const lines = [
        "Meeting Notes - 10/24",
        "",
        "1. Finalize the UI design for",
        "   the mobile app.",
        "2. Review API endpoints with",
        "   the backend team.",
        "3. Buy coffee beans!! ☕",
        "",
        "- John"
    ];

    let startY = 70;
    lines.forEach(line => {
        ctx.fillText(line, 40, startY);
        startY += 40;
    });

    return canvas.toDataURL('image/png');
  };

  const loadSample = () => {
      let sampleDataUrl = '';
      if (mode === 'formula') sampleDataUrl = createFormulaSampleImage();
      else if (mode === 'table') sampleDataUrl = createTableSampleImage();
      else if (mode === 'handwriting') sampleDataUrl = createHandwritingSampleImage();

      setImage(sampleDataUrl);
      resetResults();
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    const config = getModelConfig('ocr');
    if (!config.apiKey) {
        alert('请先在右上角用户中心配置 API Key');
        return;
    }

    setIsAnalyzing(true);
    resetResults();

    try {
      // Data URL format: data:[<mediatype>][;base64],<data>
      const split = image.split(',');
      const meta = split[0]; 
      const base64Data = split[1];
      
      let mimeType = 'image/png';
      const mimeMatch = meta.match(/data:([^;]+);/);
      if (mimeMatch) {
          mimeType = mimeMatch[1];
      }

      if (mode === 'formula') {
          // Formula mode keeps using JSON for structured output
          const responseText = await generateContent({
            apiKey: config.apiKey,
            model: config.model,
            baseUrl: config.baseUrl,
            image: base64Data,
            mimeType: mimeType,
            prompt: 'Identify the mathematical formula in the image. Output strictly valid JSON with 4 fields: "inline" ($...$), "block" ($$...$$), "raw" (pure latex), "html" (mathml). No markdown formatting outside the JSON.',
            jsonSchema: {
                type: Type.OBJECT,
                properties: {
                  inline: { type: Type.STRING },
                  block: { type: Type.STRING },
                  raw: { type: Type.STRING },
                  html: { type: Type.STRING }
                },
                required: ['inline', 'block', 'raw', 'html']
            }
          });
          
          const data = parseJsonSafe(responseText);
          setFormulaResult(data);
          setActiveFormulaTab('block');

      } else if (mode === 'table') {
          // Table mode switches to RAW TEXT to avoid JSON errors with large content
          const prompt = `Analyze this image containing a table or document layout.
          Output strictly the content in Markdown format. 
          Use standard Markdown tables.
          Do not wrap the output in JSON. Just return the Markdown text.`;

          const responseText = await generateContent({
              apiKey: config.apiKey,
              model: config.model,
              baseUrl: config.baseUrl,
              image: base64Data,
              mimeType: mimeType,
              prompt: prompt
              // No jsonSchema here
          });

          if (!responseText || responseText.length < 5) {
             throw new Error("Empty response");
          }

          setTableResult({
              markdown: responseText,
              html: responseText // We will just render markdown as preview
          });
          setActiveTableTab('preview');
          
      } else if (mode === 'handwriting') {
          // Handwriting mode switches to RAW TEXT
          const responseText = await generateContent({
              apiKey: config.apiKey,
              model: config.model,
              baseUrl: config.baseUrl,
              image: base64Data,
              mimeType: mimeType,
              prompt: 'Transcribe the handwritten text in this image into clear Markdown format. Preserve lists, headings, and emphasis. Do not wrap in JSON, just return the text.',
              // No jsonSchema here
          });

          if (!responseText || responseText.length < 5) {
             throw new Error("Empty response");
          }

          setHandwritingResult({
              markdown: responseText,
              html: responseText
          });
          setActiveHandwritingTab('preview');
      }

    } catch (err: any) {
      console.error('OCR Error:', err);
      // User requested specific error message
      alert('识别失败：图片可能模糊或内容无法识别，请尝试更换质量更好的图片。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => {
        console.error('Copy failed', err);
    });
  };

  const insertContent = () => {
      if (mode === 'formula' && formulaResult) {
          onResult(formulaResult[activeFormulaTab]);
      } else if (mode === 'table' && tableResult) {
          onResult(tableResult.markdown);
      } else if (mode === 'handwriting' && handwritingResult) {
          onResult(handwritingResult.markdown);
      }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1440px] mx-auto min-h-full flex flex-col" onPaste={handlePaste}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">AI 视觉识别中心 (AI Vision)</h2>
        
        {/* Mode Switcher */}
        <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
                <button 
                    onClick={() => setMode('formula')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'formula' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Σ 公式识别
                </button>
                <button 
                    onClick={() => setMode('table')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'table' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    📋 表格识别
                </button>
                <button 
                    onClick={() => setMode('handwriting')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'handwriting' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    ✍️ 手写体识别
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Input */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl h-[450px] flex flex-col items-center justify-center relative overflow-hidden group hover:border-[var(--primary-color)] hover:bg-[var(--primary-50)] transition-all duration-300 shadow-sm">
            {image ? (
              <>
                <img src={image} alt="Preview" className="max-h-full max-w-full object-contain p-6" />
                <div className="absolute top-4 right-4">
                  <button onClick={() => { setImage(null); resetResults(); }} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </>
            ) : (
              <div className="text-center cursor-pointer p-10 w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 bg-[var(--primary-50)] rounded-full flex items-center justify-center mb-4 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                    {mode === 'formula' ? (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    ) : mode === 'table' ? (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    ) : (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    )}
                </div>
                <h4 className="text-slate-800 font-bold text-xl mb-2">粘贴截图或点击上传</h4>
                <p className="text-slate-400 text-sm">支持 PNG/JPG (自动压缩)</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                
                <button 
                    onClick={(e) => { e.stopPropagation(); loadSample(); }}
                    className={`mt-6 text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${
                        mode === 'formula' 
                        ? 'bg-[var(--primary-50)] text-[var(--primary-color)] border-[var(--primary-color)] hover:bg-[var(--primary-hover)] hover:text-white' 
                        : mode === 'table'
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                >
                    加载示例 (Sample)
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={analyzeImage}
            disabled={!image || isAnalyzing}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex flex-col items-center justify-center ${
                !image || isAnalyzing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : mode === 'formula' ? 'bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white shadow-xl' 
                : mode === 'table' ? 'bg-green-600 hover:bg-green-700 text-white shadow-xl'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xl'
            }`}
          >
            {isAnalyzing ? (
                <span className="flex items-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   正在 AI 识别中...
                </span>
            ) : (mode === 'formula' ? '识别公式 (Analyze)' : mode === 'table' ? '识别表格 (OCR)' : '识别手写体 (OCR)')}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[550px]">
          {/* 1. Formula Mode Results */}
          {mode === 'formula' && (
              formulaResult ? (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                        {['block', 'inline', 'raw', 'html'].map(tab => (
                            <button key={tab} onClick={() => setActiveFormulaTab(tab as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize ${activeFormulaTab === tab ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl text-[var(--primary-50)] font-mono text-xs break-all overflow-y-auto max-h-32 shadow-inner">
                        {formulaResult[activeFormulaTab]}
                    </div>
                    <div className="flex-1 border border-slate-100 rounded-xl flex items-center justify-center p-4 overflow-auto bg-slate-50/50">
                        {activeFormulaTab !== 'html' ? (
                            <div className="prose prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formulaResult[activeFormulaTab]}</ReactMarkdown>
                            </div>
                        ) : (
                           <div className="text-xs text-slate-500 p-4 w-full h-full overflow-auto">
                               <div dangerouslySetInnerHTML={{ __html: formulaResult.html }} />
                           </div>
                        )}
                    </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <p>上传图片以识别数学公式</p>
                </div>
              )
          )}

          {/* 2. Table Mode Results */}
          {mode === 'table' && (
              tableResult ? (
                <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                        <button onClick={() => setActiveTableTab('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTableTab === 'preview' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>
                            渲染预览 (Preview)
                        </button>
                        <button onClick={() => setActiveTableTab('markdown')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeTableTab === 'markdown' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>
                            Markdown 源码
                        </button>
                    </div>

                    <div className="flex-1 border border-slate-200 rounded-xl p-4 overflow-auto bg-white custom-scrollbar">
                        {activeTableTab === 'preview' && (
                            <div className="prose prose-sm max-w-none prose-table:border-collapse prose-table:border prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-td:border">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        table: ({node, ...props}) => <table className="min-w-full border-collapse border border-slate-300 mb-4" {...props} />,
                                        thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                                        th: ({node, ...props}) => <th className="border border-slate-300 px-4 py-2 text-left font-bold text-slate-700 text-sm" {...props} />,
                                        td: ({node, ...props}) => <td className="border border-slate-300 px-4 py-2 text-slate-600 text-sm" {...props} />,
                                    }}
                                >
                                    {tableResult.markdown}
                                </ReactMarkdown>
                            </div>
                        )}
                        {activeTableTab === 'markdown' && (
                            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">{tableResult.markdown}</pre>
                        )}
                        {/* No HTML source tab for simplicity in raw text mode */}
                    </div>
                </div>
              ) : (
                mode === 'table' && <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <p>上传图片以识别表格与文档排版</p>
                </div>
              )
          )}

          {/* 3. Handwriting Mode Results */}
          {mode === 'handwriting' && (
              handwritingResult ? (
                  <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                      <div className="flex bg-amber-50 p-1 rounded-xl w-fit border border-amber-100">
                          <button onClick={() => setActiveHandwritingTab('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeHandwritingTab === 'preview' ? 'bg-white text-amber-600 shadow-sm' : 'text-amber-800/50'}`}>
                              渲染预览 (Preview)
                          </button>
                          <button onClick={() => setActiveHandwritingTab('markdown')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${activeHandwritingTab === 'markdown' ? 'bg-white text-amber-600 shadow-sm' : 'text-amber-800/50'}`}>
                              Markdown
                          </button>
                      </div>

                      <div className="flex-1 border border-slate-200 rounded-xl p-4 overflow-auto bg-white custom-scrollbar">
                          {activeHandwritingTab === 'preview' && (
                              <div className="prose prose-sm max-w-none prose-slate">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{handwritingResult.markdown}</ReactMarkdown>
                              </div>
                          )}
                          {activeHandwritingTab === 'markdown' && (
                              <textarea 
                                  className="w-full h-full p-0 text-slate-700 resize-none focus:outline-none font-mono text-sm bg-transparent"
                                  readOnly
                                  value={handwritingResult.markdown}
                              />
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                      <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      <p>上传图片以识别手写笔记</p>
                  </div>
              )
          )}

          {/* Action Buttons */}
          {(formulaResult || tableResult || handwritingResult) && (
             <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-slate-100">
                <button 
                    onClick={() => {
                        if (mode === 'formula' && formulaResult) handleCopy(formulaResult[activeFormulaTab]);
                        if (mode === 'table' && tableResult) handleCopy(tableResult.markdown);
                        if (mode === 'handwriting' && handwritingResult) handleCopy(handwritingResult.markdown);
                    }} 
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center ${
                        copyStatus === 'copied' 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    {copyStatus === 'copied' ? '已复制' : '复制内容'}
                </button>
                <button 
                    onClick={insertContent} 
                    className={`text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center ${
                        mode === 'formula' ? 'bg-[var(--primary-color)] hover:bg-[var(--primary-hover)]' : 
                        mode === 'table' ? 'bg-green-600 hover:bg-green-700' : 
                        'bg-amber-500 hover:bg-amber-600'
                    }`}
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    插入编辑器
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaOCR;
