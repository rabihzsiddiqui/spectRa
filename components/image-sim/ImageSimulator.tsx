"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// CVD type options
// ---------------------------------------------------------------------------
const CVD_OPTIONS = [
  { value: "deuteranomaly", label: "deuteranomaly" },
  { value: "deuteranopia",  label: "deuteranopia"  },
  { value: "protanomaly",   label: "protanomaly"   },
  { value: "protanopia",    label: "protanopia"    },
  { value: "tritanopia",    label: "tritanopia"    },
  { value: "tritanomaly",   label: "tritanomaly"   },
] as const;

type CvdValue = typeof CVD_OPTIONS[number]["value"];

const MAX_DIM = 2048;

// ---------------------------------------------------------------------------
// Inline Web Worker source — all CVD math self-contained (no imports)
// Uses Brettel 1997 / Viénot 1999 matrices, same as cvd-matrices.ts
// ---------------------------------------------------------------------------
const WORKER_SRC = `
const M_RL=[0.31399022,0.63951294,0.04649755,0.15537241,0.75789446,0.08670142,0.01775239,0.10944209,0.87256922];
const M_LR=[5.47221206,-4.6419601,0.16963142,-1.1252419,2.29317979,-0.1678999,0.02980165,-0.19318073,1.16364789];
const M_PROTAN=[0,2.02344,-2.52581,0,1,0,0,0,1];
const M_DEUTAN=[1,0,0,0.494207,0,1.24827,0,0,1];
const M_TRI1=[1,0,0,0,1,0,-0.395913,0.801109,0];
const M_TRI2=[1,0,0,0,1,0,0.154501,0.121772,0];
const N=[0.34478,-0.65456,0.70376];
const NW=0.39398;

function lin(c){return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
function delin(c){return c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055;}
function clp(v){return v<0?0:v>1?1:v;}
function m3(m,x,y,z){return[m[0]*x+m[1]*y+m[2]*z,m[3]*x+m[4]*y+m[5]*z,m[6]*x+m[7]*y+m[8]*z];}

function sim(r,g,b,type,sev){
  const lr=lin(r/255),lg=lin(g/255),lb=lin(b/255);
  const[l,m,s]=m3(M_RL,lr,lg,lb);
  let dl,dm,ds,anom=false;
  if(type==='protanopia'||type==='protanomaly'){
    [dl,dm,ds]=m3(M_PROTAN,l,m,s);anom=type==='protanomaly';
  }else if(type==='deuteranopia'||type==='deuteranomaly'){
    [dl,dm,ds]=m3(M_DEUTAN,l,m,s);anom=type==='deuteranomaly';
  }else{
    const nd=N[0]*l+N[1]*m+N[2]*s;
    [dl,dm,ds]=m3(nd>NW?M_TRI1:M_TRI2,l,m,s);anom=type==='tritanomaly';
  }
  const sv=anom?sev:1.0;
  const sl=l+sv*(dl-l),sm=m+sv*(dm-m),ss2=s+sv*(ds-s);
  const[nr,ng,nb]=m3(M_LR,sl,sm,ss2);
  return[
    Math.round(clp(delin(clp(nr)))*255),
    Math.round(clp(delin(clp(ng)))*255),
    Math.round(clp(delin(clp(nb)))*255),
  ];
}

self.onmessage=function(e){
  const{pixels,type,severity}=e.data;
  const d=new Uint8ClampedArray(pixels);
  for(let i=0;i<d.length;i+=4){
    const[r,g,b]=sim(d[i],d[i+1],d[i+2],type,severity);
    d[i]=r;d[i+1]=g;d[i+2]=b;
  }
  self.postMessage({pixels:d.buffer},[d.buffer]);
};
`;

// ---------------------------------------------------------------------------
// Chevron icon (shared with PaletteSection pattern)
// ---------------------------------------------------------------------------
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-neutral-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ImageSimulator
// ---------------------------------------------------------------------------
export default function ImageSimulator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cvdType, setCvdType] = useState<CvdValue>("deuteranomaly");
  const [severity, setSeverity] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const simulatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Create blob URL on mount; clean up on unmount
  useEffect(() => {
    const blob = new Blob([WORKER_SRC], { type: "text/javascript" });
    blobUrlRef.current = URL.createObjectURL(blob);
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  // Draw image to canvas, scaling down if larger than MAX_DIM
  function drawToCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement): ImageData {
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }

  // Run simulation via worker
  const runSimulation = useCallback((img: HTMLImageElement, type: CvdValue, sev: number) => {
    if (!originalCanvasRef.current || !simulatedCanvasRef.current || !blobUrlRef.current) return;

    const imageData = drawToCanvas(img, originalCanvasRef.current);

    const simCanvas = simulatedCanvasRef.current;
    simCanvas.width = originalCanvasRef.current.width;
    simCanvas.height = originalCanvasRef.current.height;

    // Terminate any in-flight worker
    if (workerRef.current) workerRef.current.terminate();

    setIsProcessing(true);

    const worker = new Worker(blobUrlRef.current);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { pixels } = e.data;
      const ctx = simCanvas.getContext("2d");
      if (!ctx) return;
      const output = new ImageData(new Uint8ClampedArray(pixels), simCanvas.width, simCanvas.height);
      ctx.putImageData(output, 0, 0);
      setIsProcessing(false);
      worker.terminate();
    };

    // Transfer buffer ownership to worker (zero-copy)
    const pixelsCopy = imageData.data.buffer.slice(0);
    worker.postMessage({ pixels: pixelsCopy, type, severity: sev }, [pixelsCopy]);
  }, []);

  // Re-run whenever image, type, or severity changes
  useEffect(() => {
    if (image) runSimulation(image, cvdType, severity);
  }, [image, cvdType, severity, runSimulation]);

  // Load an image File
  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // Drag & drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave() { setIsDragOver(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  // Curtain slider — get position (0-100) from pointer x
  function getSliderPos(clientX: number): number {
    if (!containerRef.current) return sliderPos;
    const rect = containerRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    setSliderPos(getSliderPos(e.clientX));
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setSliderPos(getSliderPos(e.clientX));
  }
  function handlePointerUp() { setIsDragging(false); }

  // Download simulated image
  function handleDownload() {
    if (!simulatedCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = `spectra-${cvdType}.png`;
    link.href = simulatedCanvasRef.current.toDataURL("image/png");
    link.click();
  }

  const isAnomaly = cvdType.endsWith("anomaly");

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/50">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-neutral-700/20"
        aria-expanded={isExpanded}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">see through my eyes</h2>
          <p className="mt-0.5 text-sm text-neutral-400">
            upload any image to see how it looks with different types of color blindness.
          </p>
        </div>
        <ChevronIcon expanded={isExpanded} />
      </button>

      {isExpanded && (
        <div className="space-y-6 border-t border-neutral-700/50 p-6">
          {!image ? (
            /* Drop zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
                isDragOver
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-700/20"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-500"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              <div className="text-center">
                <p className="text-sm text-neutral-300">drag & drop or click to upload</p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  processed entirely in your browser. nothing is uploaded.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileInput}
              />
            </div>
          ) : (
            /* Comparison view */
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* CVD type */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-500">vision type</label>
                  <select
                    value={cvdType}
                    onChange={(e) => setCvdType(e.target.value as CvdValue)}
                    className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                  >
                    {CVD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Severity — only meaningful for anomaly types */}
                <div className="flex items-center gap-2">
                  <label className={`text-xs ${isAnomaly ? "text-neutral-500" : "text-neutral-700"}`}>
                    severity
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(severity * 100)}
                    onChange={(e) => setSeverity(Number(e.target.value) / 100)}
                    disabled={!isAnomaly}
                    className="w-28 accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-30"
                  />
                  <span className={`w-8 text-xs tabular-nums ${isAnomaly ? "text-neutral-400" : "text-neutral-700"}`}>
                    {isAnomaly ? `${Math.round(severity * 100)}%` : "100%"}
                  </span>
                </div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    download
                  </button>
                  <button
                    onClick={() => { setImage(null); setSliderPos(50); }}
                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                  >
                    new image
                  </button>
                </div>
              </div>

              {/* Curtain comparison */}
              <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-xl border border-neutral-700/50 cursor-ew-resize select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* Original — base layer, defines container height */}
                <canvas
                  ref={originalCanvasRef}
                  className="block w-full"
                />

                {/* Simulated — absolute overlay, clipped to show right portion */}
                <canvas
                  ref={simulatedCanvasRef}
                  className="absolute top-0 left-0 w-full"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                />

                {/* Corner labels */}
                <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                  original
                </div>
                <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                  {cvdType}
                </div>

                {/* Divider line */}
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/80"
                  style={{ left: `${sliderPos}%` }}
                />

                {/* Drag handle knob */}
                <div
                  className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#09090b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                    <polyline points="9 18 15 12 9 6" transform="translate(6 0)" />
                  </svg>
                </div>

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
                    <span className="text-sm text-neutral-300">processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
