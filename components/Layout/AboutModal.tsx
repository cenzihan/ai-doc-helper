
import React, { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'terms' | 'faq'>('about');
  const [logoError, setLogoError] = useState(false);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-[540px] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                {!logoError ? (
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl font-bold">A</span>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Doc Helper</h3>
              <p className="text-slate-500 text-sm">V2.0 Professional</p>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              AI Doc Helper 是一款专为学术与专业文档处理打造的智能助手。我们融合前沿 AI 技术，专注解决 Markdown 到 Word 转换中的排版难题，提供 AI 视觉识别（公式/表格/ handwritten）、多文档智能处理、深度调研报告生成、AI 学术润色及公众号一键排版等全方位功能，让文档创作更高效、更专业。
            </p>
            
            <div className="mt-6 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">核心功能</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">📝</span>
                    <span className="font-bold text-slate-700 text-xs">编辑器 AI 助手</span>
                  </div>
                  <p className="text-slate-500 text-xs">智能写作建议、学术润色、自定义AI助手</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">👁️</span>
                    <span className="font-bold text-slate-700 text-xs">AI 视觉识别</span>
                  </div>
                  <p className="text-slate-500 text-xs">公式、表格、手写和PDF识别</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">📚</span>
                    <span className="font-bold text-slate-700 text-xs">多文档处理</span>
                  </div>
                  <p className="text-slate-500 text-xs">智能重命名、批量报告聚合、自定义多文档处理</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">🔍</span>
                    <span className="font-bold text-slate-700 text-xs">AI 深度调研</span>
                  </div>
                  <p className="text-slate-500 text-xs">自动化报告生成</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">📄</span>
                    <span className="font-bold text-slate-700 text-xs">Word 预览导出</span>
                  </div>
                  <p className="text-slate-500 text-xs">完美还原格式、原生公式</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 hover:border-[var(--primary-color)] transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="text-[var(--primary-color)] mr-2">⚙️</span>
                    <span className="font-bold text-slate-700 text-xs">Prompt开放自配置接口</span>
                  </div>
                  <p className="text-slate-500 text-xs">自定义AI提示词模板</p>
                </div>
                
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2">开发者寄语</h4>
              <p className="text-slate-500 text-xs italic">
                "省下来的时间可以喝杯咖啡☕️☕️"
              </p>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col items-center">
                <a 
                    href="https://github.com/cenzihan/ai-doc-helper.git" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-xs font-bold text-[var(--primary-color)] hover:text-[var(--primary-hover)] transition-colors mb-1"
                >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    开源链接 (GitHub)
                </a>
                <p className="text-[10px] text-slate-400">by 【SYSU - The College Dropout团队】</p>
                <a href="mailto:cenzh3@mail2.sysu.edu.cn" className="text-[10px] text-slate-400 mt-1 hover:text-[var(--primary-color)] transition-colors">
                    联系邮箱：cenzh3@mail2.sysu.edu.cn
                </a>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-[540px] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-lg font-bold text-slate-900">隐私政策 (Privacy Policy)</h3>
            <p className="text-xs text-slate-500 mb-4">生效日期：2025年12月1日</p>
            
            <div className="text-sm text-slate-600 space-y-4">
              <section>
                <h4 className="font-bold text-slate-800 mb-1">1. 数据的收集与存储</h4>
                <p>AI Doc Helper 严格遵循“本地优先”原则。您的 API Key 仅加密存储于您本地浏览器的 `LocalStorage` 中，绝不会上传至我们的服务器。所有文档处理（转换、预览）均在浏览器端（Client-side）完成。</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-800 mb-1">2. AI 交互数据</h4>
                <p>当您使用 AI 润色、OCR 识别等功能时，相关文本或图片数据将直接发送至您选择的第三方模型服务商（如 Google Gemini、阿里云 DashScope 等）。我们作为工具提供方，不拦截、不存储、不训练您的任何业务数据。</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-800 mb-1">3. 第三方服务</h4>
                <p>本应用依赖第三方大模型 API。使用本服务即代表您知悉并同意相关模型提供商的数据隐私协议。请勿上传涉及国家安全、商业机密或个人隐私的敏感信息。</p>
              </section>
              
              <section>
                 <h4 className="font-bold text-slate-800 mb-1">4. Cookies 使用</h4>
                 <p>本站仅使用必要的 LocalStorage 来保存您的主题偏好和配置信息，不使用 Cookie 进行广告追踪。</p>
              </section>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-[540px] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-lg font-bold text-slate-900">服务条款 (Terms of Service)</h3>
            
            <div className="text-sm text-slate-600 space-y-4">
              <section>
                  <h4 className="font-bold text-slate-800 mb-1">1. 接受条款</h4>
                  <p>访问和使用 AI Doc Helper 即表示您同意遵守本条款。如果您不同意，请立即停止使用。</p>
              </section>

              <section>
                  <h4 className="font-bold text-slate-800 mb-1">2. 使用许可与限制</h4>
                  <p>本工具提供给个人学习、科研及非商业用途免费使用。您承诺不利用本工具生成、传播任何违反法律法规、社会公德或侵犯他人权益的内容（包括但不限于色情、暴力、政治敏感信息）。</p>
              </section>

              <section>
                  <h4 className="font-bold text-slate-800 mb-1">3. 免责声明</h4>
                  <p>AI 生成内容具有随机性（幻觉），仅供参考。开发者不对 AI 生成内容的准确性、完整性负责。您应对输出结果进行人工核查。因使用本工具导致的任何直接或间接损失，开发者不承担法律责任。</p>
              </section>

              <section>
                  <h4 className="font-bold text-slate-800 mb-1">4. 知识产权</h4>
                  <p>本工具的源代码受开源协议保护。您利用本工具创作的文档内容的知识产权归您所有。</p>
              </section>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="space-y-4 animate-in fade-in duration-300 h-[540px] overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-lg font-bold text-slate-900">常见问题 (FAQ)</h3>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 如何获取API？</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  A: 你可以前往国内有名的API网站获取（有免费额度可以试用）。例如：
                  <br />
                  <a href="https://www.siliconflow.cn/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-color)] hover:underline font-medium">
                    • 硅基流动
                  </a>
                  <br />
                  <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-color)] hover:underline font-medium">
                    • 阿里云百炼
                  </a>
                  <br />
                  <a href="https://www.aliyun.com/product/dashscope" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-color)] hover:underline font-medium">
                    • 通义千问
                  </a>
                  <br />
                  
                  <span className="font-bold text-slate-600">💡 重要提示：</span>
                  <span className="text-slate-500">使用AI视觉识别（公式识别、表格识别等）功能时，请选择具备视觉能力的模型（如 GPT-4V、Qwen-VL、DeepSeek-VL 等多模态模型）。不同模型的识别准确率与效果可能存在差异，建议根据实际需求选择合适的模型。</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 如何配置API？</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  A: 点击页面右上角的用户头像（显示为 Pro User 或 No Key），进入个性化配置界面。在对话框中可以填写：
                  
                  <span className="block mt-2 font-medium text-slate-600">• Base URL：API 请求的基础地址</span>
                  <span className="block font-medium text-slate-600">• API Key：用于身份验证的密钥</span>
                  <span className="block font-medium text-slate-600">• 自定义模型：填写模型 ID（如 deepseek-chat）或从预设模型中选择</span>
                  
                  <span className="block mt-2 text-slate-600">💡 <span className="font-bold">注意：</span>costrict比赛版本已内嵌免费 API 供体验使用，如无特殊需求，无需额外配置即可正常使用所有功能。</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 使用成本如何？</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  A: 以硅基流动平台的 Qwen/Qwen3-VL-30B-A3B-Instruct 模型（2.8元/M Tokens）为例，1元人民币可实现的使用次数如下（具体次数根据实际输入输出的 token 数量会有所波动）：
                  <br />
                  <span className="block mt-2 font-medium text-slate-600">• 编辑器 AI 助手：约 500 次</span>
                  <span className="block font-medium text-slate-600">• AI 视觉识别：约 1400 次</span>
                  <span className="block font-medium text-slate-600">• 多文档智能处理：约 500 次</span>
                  <span className="block font-medium text-slate-600">• AI 深度调研：约 50 次</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 图片可以导出到 Word 吗？</p>
                <p className="text-slate-500 text-xs">A: 可以！V1.5 版本已支持图片导出。只要 Markdown 中的图片链接是有效的（支持 Base64 或允许跨域的 URL），导出时会自动嵌入 Word 文档。</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 公众号格式复制后图片不显示？</p>
                <p className="text-slate-500 text-xs">A: 微信公众号对外部图片有防盗链限制。建议先将图片上传至微信后台，或使用 Base64 格式的图片。</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-800 text-xs mb-1">Q: 公式需要手动转图片吗？</p>
                <p className="text-slate-500 text-xs">A: 不需要。本工具支持导出为 Word 原生公式 (OMML)，您可以直接在 Word 中双击编辑公式，无需转换为图片。</p>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'about', label: '关于我们' },
    { id: 'faq', label: '常见问题' },
    { id: 'privacy', label: '隐私政策' },
    { id: 'terms', label: '服务条款' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 flex overflow-hidden h-[600px]">
        
        {/* Sidebar */}
        <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
          <div className="mb-6 px-2">
             <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Information</span>
          </div>
          <nav className="space-y-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[var(--primary-color)] shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="text-[10px] text-slate-300 px-2 mt-auto">
            © 2025 AI Doc Helper
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 relative">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
