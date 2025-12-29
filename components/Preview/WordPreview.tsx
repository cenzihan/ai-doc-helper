import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { WordTemplate } from '../../types';
import { downloadDocx } from '../../utils/converter';

interface WordPreviewProps {
  markdown: string;
  isProcessing: boolean;
  progress: number;
}

const WordPreview: React.FC<WordPreviewProps> = ({ markdown, isProcessing, progress }) => {
  const [template, setTemplate] = useState<WordTemplate>(WordTemplate.STANDARD);
  const [scale, setScale] = useState(1);
  const [copyStatus, setCopyStatus] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const wechatContentRef = useRef<HTMLDivElement>(null);

  // 动态计算缩放比例，确保 A4 纸张完整显示
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && paperRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 64; // 减去 padding
        const paperWidth = 794; // 210mm 约为 794px (96dpi)
        if (containerWidth < paperWidth) {
          setScale(containerWidth / paperWidth);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100); 
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [markdown]);

  const getTemplateStyles = () => {
    switch(template) {
      case WordTemplate.ACADEMIC:
        return "prose-academic text-[10.5pt] leading-[1.6] px-[25mm] py-[30mm] bg-white shadow-2xl mx-auto border border-slate-200";
      case WordTemplate.NOTE:
        return "max-w-none text-[11pt] leading-relaxed px-[20mm] py-[25mm] bg-white shadow-lg mx-auto rounded-lg border border-slate-100";
      default:
        return "max-w-none text-[12pt] leading-normal px-[25mm] py-[30mm] bg-white shadow-2xl mx-auto border border-slate-200";
    }
  };

  const handleDownload = async () => {
    await downloadDocx(markdown, template);
  };

  // 复制为微信公众号格式
  const copyToWeChat = () => {
    if (!wechatContentRef.current) return;
    
    const content = wechatContentRef.current;
    
    // 创建一个 Range 对象
    const range = document.createRange();
    range.selectNode(content);
    
    // 获取 Selection 对象
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            document.execCommand('copy');
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        } catch (err) {
            alert('复制失败，请尝试手动复制');
        }
        
        selection.removeAllRanges();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#8E97A4] overflow-hidden" ref={containerRef}>
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-300 shadow-md z-20 space-x-2">
        <div className="flex items-center space-x-2 flex-1 overflow-hidden">
          <div className="flex items-center whitespace-nowrap">
             <span className="text-xs font-semibold text-[var(--primary-color)] mr-2">
               {Math.round(scale * 100)}%
             </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <select 
            value={template} 
            onChange={(e) => setTemplate(e.target.value as WordTemplate)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)] font-medium text-slate-700 w-full max-w-[150px]"
          >
            <option value={WordTemplate.STANDARD}>📄 标准公文</option>
            <option value={WordTemplate.ACADEMIC}>🎓 学术论文</option>
            <option value={WordTemplate.NOTE}>📝 简洁笔记</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
            <button
                onClick={copyToWeChat}
                className={`text-xs font-bold px-3 py-1.5 rounded shadow-sm border flex items-center transition-all ${
                    copyStatus 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                }`}
                title="复制带有样式的 HTML 到微信公众号后台"
            >
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 13.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm6.5 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm5.9-6c0-3.31-3.13-6-7-6s-7 2.69-7 6c0 1.77.89 3.37 2.34 4.5.21.16.27.42.15.66l-.59 1.83c-.09.28.21.53.46.39l2.12-1.2c.19-.11.41-.12.61-.04.62.24 1.28.36 1.95.36 3.87 0 7-2.69 7-6zm-16.7 8.35c-2.38-.63-4.14-2.5-4.14-4.7 0-2.88 2.87-5.2 6.4-5.2 3.53 0 6.4 2.32 6.4 5.2 0 .54-.08 1.06-.23 1.55-.38-.03-.77-.05-1.17-.05-4.32 0-7.83 2.87-7.83 6.4 0 .28.02.55.07.82-.17.06-.34.1-.51.1-1.07 0-2.07-.31-2.92-.84l-1.63.92-.45-1.41.69-1.92c-.41-.56-.68-1.22-.68-1.92z"/></svg>
                {copyStatus ? '已复制！' : '复制公众号格式'}
            </button>
            <button 
            onClick={handleDownload}
            className="bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center transform transition-all active:scale-95"
            >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出 Word
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-8 flex justify-center items-start scroll-smooth custom-scrollbar">
        <div 
          ref={paperRef}
          className="relative transition-transform duration-300 ease-out origin-top mb-20"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Main Word Preview Area */}
          <div className={`w-[210mm] min-h-[297mm] transition-all duration-500 ${getTemplateStyles()} prose prose-slate break-words`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-10 text-center text-slate-900 border-b-0 pb-0" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-5 border-b-2 border-slate-900 pb-2 break-words" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-8 mb-4 text-slate-800 break-words" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 text-justify leading-relaxed text-slate-800 break-words" {...props} />,
                img: ({node, ...props}) => <img className="mx-auto rounded-lg shadow-md max-h-[500px]" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-slate-400" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                th: ({node, ...props}) => <th className="border border-slate-400 px-4 py-2 font-bold text-slate-800" {...props} />,
                td: ({node, ...props}) => <td className="border border-slate-400 px-4 py-2 text-slate-700" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-4" {...props} />,
                code: ({node, className, children, ...props}: any) => {
                  const inline = props.inline;
                  if (inline) return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-pink-700 font-mono text-[0.9em]" {...props}>{children}</code>;
                  return (
                    <pre className="bg-[#f8fafc] text-slate-800 p-5 rounded border border-slate-200 overflow-x-auto my-6 text-[0.85em] font-mono whitespace-pre-wrap break-all">
                      <code {...props}>{children}</code>
                    </pre>
                  );
                },
                // Explicitly handle math nodes to avoid object rendering errors
                math: ({value, children}: any) => <div className="my-4 text-center">{children || value}</div>,
                inlineMath: ({value, children}: any) => <span className="mx-1">{children || value}</span>
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
          
          {/* Hidden Area for WeChat Styles (Inline Styles applied here) */}
          <div className="hidden">
             <div ref={wechatContentRef} style={{ width: '100%', maxWidth: '677px', fontFamily: '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif' }}>
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        h1: ({node, ...props}) => <h1 style={{ fontSize: '22px', fontWeight: 'bold', borderBottom: '2px solid var(--primary-color, #2563eb)', paddingBottom: '10px', marginBottom: '20px', marginTop: '30px', textAlign: 'center', color: '#333' }} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderLeft: '4px solid var(--primary-color, #2563eb)', paddingLeft: '10px', marginBottom: '16px', marginTop: '24px', backgroundColor: '#f3f4f6', padding: '5px 10px', color: '#333' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', marginTop: '20px', color: '#333' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '14px', textAlign: 'justify', color: '#3f3f3f' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '8px', color: '#3f3f3f' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ color: 'var(--primary-color, #2563eb)', fontWeight: 'bold' }} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid #d1d5db', paddingLeft: '14px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic', margin: '20px 0', backgroundColor: '#f9fafb', padding: '10px 14px' }} {...props} />,
                        img: ({node, ...props}) => <img style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '100%', margin: '20px auto', display: 'block' }} {...props} />,
                        code: ({node, className, children, ...props}: any) => {
                            const inline = props.inline;
                            if (inline) return <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#d63384', fontFamily: 'monospace', fontSize: '14px' }} {...props}>{children}</code>;
                            return <pre style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '15px', borderRadius: '8px', overflowX: 'auto', margin: '20px 0', fontSize: '13px', lineHeight: '1.5' }}><code {...props}>{children}</code></pre>;
                        },
                        // Explicitly handle math nodes for WeChat view as well
                        math: ({value, children}: any) => <div style={{margin: '16px 0', textAlign: 'center'}}>{children || value}</div>,
                        inlineMath: ({value, children}: any) => <span style={{margin: '0 4px'}}>{children || value}</span>
                    }}
                >
                    {markdown}
                </ReactMarkdown>
             </div>
          </div>

          {/* 堆叠效果 - 模拟真实纸张 */}
          <div className="absolute top-1 left-1 -z-10 w-full h-full bg-slate-400 opacity-20 shadow-sm"></div>
          <div className="absolute top-2 left-2 -z-20 w-full h-full bg-slate-500 opacity-10 shadow-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default WordPreview;