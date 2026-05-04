"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { motion } from "framer-motion";
import { 
  QrCode, 
  Download, 
  Share2, 
  ArrowLeft, 
  Sparkles, 
  Link as LinkIcon,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

const CR_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjMwIiBmaWxsPSIjMDY0ZTMiLz48dGV4dCB4PSI1MCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0NSIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DUjwvdGV4dD48L3N2Zz4=";

function QRCodeContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";
  const [url, setUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "churun-qr-code.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px]"
        />
      </div>

      <nav className="absolute top-12 left-8 right-8 flex justify-between items-center z-50 max-w-4xl mx-auto w-full">
         <Link href="/" className="w-12 h-12 bg-white/80 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm hover:scale-105 transition">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
         </Link>
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-900 rounded-2xl flex items-center justify-center">
               <span className="text-white font-black text-sm">CR</span>
            </div>
            <h1 className="text-xs font-black tracking-[0.2em] text-slate-800 uppercase">QR Generator</h1>
         </div>
         <div className="w-12 h-12" />
      </nav>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_40px_80px_-20px_rgba(6,78,59,0.08)] border border-white">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-8 h-8 text-emerald-900" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">產生 QR Code</h2>
            <p className="text-sm text-slate-400 mt-2">輸入網址或文字，立即產生專屬碼。</p>
          </div>

          <div className="space-y-8">
            {/* Input Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6">內容網址</label>
              <div className="relative">
                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                <input 
                  type="text" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://churun.tea/..." 
                  className="w-full bg-slate-50 border-none p-6 pl-16 rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-emerald-900/5 transition shadow-inner"
                />
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center gap-8 py-4">
              <motion.div 
                key={url}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-[3rem] shadow-2xl shadow-emerald-900/10 border border-slate-50 relative group"
              >
                <div className="absolute inset-0 bg-emerald-500/5 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative">
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={url || "https://churun.tea"}
                    size={220}
                    level={"H"}
                    includeMargin={true}
                    className="rounded-2xl"
                    imageSettings={{
                      src: CR_LOGO,
                      x: undefined,
                      y: undefined,
                      height: 50,
                      width: 50,
                      excavate: true,
                    }}
                  />
                </div>
              </motion.div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 py-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "已複製" : "複製內容"}
                </button>
                <button 
                  onClick={downloadQRCode}
                  className="flex-1 py-5 bg-emerald-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 下載圖片
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-12 text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">
           Digital Asset of Churun Tea House
        </p>
      </motion.div>
    </div>
  );
}

export default function QRCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-emerald-900 font-black">LOADING...</div>}>
      <QRCodeContent />
    </Suspense>
  );
}
