import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Copy, 
  Check, 
  FileCode, 
  Terminal
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const redirectsCode = `# public/_redirects (SPA 单页应用前端路由回退)
/redio/*    /redio/index.html   200
/*          /index.html         200
`;

  const workerRouterCode = `// Cloudflare Worker 子路径代理转发示例 (dronerfdiy.com/redio)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 如果匹配 /redio 或 /redio/*
    if (url.pathname.startsWith('/redio')) {
      const targetPath = url.pathname.replace(/^\\/redio/, '') || '/';
      url.pathname = targetPath;
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    
    return new Response('Not Found', { status: 404 });
  }
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#111114] border border-[#2D2D33] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#2D2D33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FFFFFF]">
                Cloudflare Pages / Workers 部署与路由指引
              </h3>
              <p className="text-xs text-[#8E9299]">
                目标路径: <code className="text-[#F27D26] font-mono">dronerfdiy.com/redio</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1C1C21] hover:bg-[#25252B] text-[#8E9299] hover:text-[#FFFFFF] border border-[#2D2D33] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#E0E0E0]">
          {/* Section 1: Base Path Verification */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>1. 相对路径与静态资源适配（已内置完成）</span>
            </h4>
            <p className="leading-relaxed text-[#8E9299]">
              本项目在 <code className="text-[#FFFFFF] font-mono bg-[#0A0A0B] px-1 py-0.5 rounded border border-[#2D2D33]">vite.config.ts</code> 中已配置{' '}
              <code className="text-[#F27D26] font-mono bg-[#0A0A0B] px-1 py-0.5 rounded border border-[#2D2D33]">base: './'</code>
              ，所有 JS、CSS、音效与图片均采用相对路径引用。无论部署在根目录还是子路径{' '}
              <code className="text-[#F27D26] font-mono bg-[#0A0A0B] px-1 py-0.5 rounded border border-[#2D2D33]">/redio/</code> 下均可直接无缝加载！
            </p>
          </div>

          {/* Section 2: _redirects File */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>2. SPA 路由回退规则 (_redirects)</span>
              </h4>
              <button
                onClick={() => copyToClipboard(redirectsCode, 'redirects')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C1C21] hover:bg-[#25252B] text-[#E0E0E0] border border-[#2D2D33] text-[11px] transition-colors"
              >
                {copiedKey === 'redirects' ? (
                  <Check className="w-3 h-3 text-[#10B981]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === 'redirects' ? '已复制' : '复制'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0A0A0B] border border-[#2D2D33] rounded-xl font-mono text-[11px] text-[#F27D26] overflow-x-auto">
              {redirectsCode}
            </pre>
          </div>

          {/* Section 3: Cloudflare Worker Subpath Router */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F27D26] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>3. Cloudflare Worker 路由代理转发代码</span>
              </h4>
              <button
                onClick={() => copyToClipboard(workerRouterCode, 'worker')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C1C21] hover:bg-[#25252B] text-[#E0E0E0] border border-[#2D2D33] text-[11px] transition-colors"
              >
                {copiedKey === 'worker' ? (
                  <Check className="w-3 h-3 text-[#10B981]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === 'worker' ? '已复制' : '复制'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0A0A0B] border border-[#2D2D33] rounded-xl font-mono text-[11px] text-[#FFFFFF] overflow-x-auto">
              {workerRouterCode}
            </pre>
          </div>

          {/* Section 4: Build & Deploy Commands */}
          <div className="p-3.5 rounded-2xl bg-[#0A0A0B] border border-[#2D2D33] space-y-1.5">
            <span className="font-bold text-[#FFFFFF] text-xs">一键打包构建命令：</span>
            <div className="font-mono text-[#F27D26] bg-[#111114] p-2 rounded-lg border border-[#2D2D33]">
              npm run build
            </div>
            <p className="text-[11px] text-[#8E9299]">
              构建产物生成在 <code className="text-[#FFFFFF]">dist/</code> 文件夹中，直接上传至 Cloudflare Pages 或任何静态托管平台即可。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D2D33] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1C1C21] hover:bg-[#25252B] text-[#E0E0E0] text-xs font-semibold rounded-xl border border-[#2D2D33] transition-colors"
          >
            了解并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
