/*
 * File: src/app/(app)/video-call/[id]/page.js
 * SR-DEV: Expert Video Page (Final Production Version)
 *
 * FEATURES:
 * - Video: Robust WebRTC connection (User App Socket).
 * - Whiteboard: Touch-enabled, Colors, Eraser, Syncs history to new joiners.
 * - Actions: "End Call" generates PDF -> Uploads -> Emails User.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing"; 
import { saveAndSendWhiteboard } from "@/actions/whiteboard"; // Ensure this action exists
import { jsPDF } from "jspdf";

// --- Tool Icons ---
const PencilIcon = ({ color }) => (
  <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200" style={{ backgroundColor: color }} />
);
const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

export default function ExpertVideoCallPage() {
  const params = useParams();
  const appointmentId = params.id;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueueRef = useRef([]);

  // Drawing State
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // UI State
  const [activeColor, setActiveColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [isEnding, setIsEnding] = useState(false);

  // Uploadthing
  const { startUpload } = useUploadThing("chatAttachment");

  // --- 1. Socket & WebRTC Setup ---
  useEffect(() => {
    if (!appointmentId) return;
    if (socketRef.current) return; // Strict Mode Guard

    // ⚠️ Point to User App URL
    const SOCKET_URL = process.env.NEXT_PUBLIC_USER_APP_URL || "https://3000-firebase-mind-namo-users-1762736047019.cluster-cd3bsnf6r5bemwki2bxljme5as.cloudworkstations.dev";

    const init = async () => {
      try {
         setStatus("Connecting to User App Socket...");
         await fetch(`${SOCKET_URL}/api/socket`).catch(() => {});

         const newSocket = io(SOCKET_URL, { 
             path: "/api/socket_io",
             transports: ["polling", "websocket"], // Robust connection
             withCredentials: true
         });
         socketRef.current = newSocket;

         newSocket.on("connect", () => {
             setStatus("Connected. Joining room...");
             newSocket.emit("join-video", appointmentId);
         });

         newSocket.on("connect_error", (err) => setStatus(`Socket Error: ${err.message}`));

         // Get Media
         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         if (localVideoRef.current) {
             localVideoRef.current.srcObject = stream;
             localVideoRef.current.muted = true; // Prevent echo
         }

         // Setup Peer
         const peer = new RTCPeerConnection({
             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
         });
         peerRef.current = peer;

         stream.getTracks().forEach((track) => peer.addTrack(track, stream));

         // Handle Remote Stream
         peer.ontrack = (event) => {
             console.log("🎥 Expert received remote stream");
             const [remoteStream] = event.streams;
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.srcObject = remoteStream;
                 // Robust play handling
                 const playPromise = remoteVideoRef.current.play();
                 if (playPromise !== undefined) {
                     playPromise.catch(error => {
                         if (error.name !== 'AbortError') console.error("Auto-play failed:", error);
                     });
                 }
                 setStatus("Connected to Client");
             }
         };

         peer.onicecandidate = (event) => {
             if (event.candidate) {
                 newSocket.emit("ice-candidate", { candidate: event.candidate, roomId: appointmentId });
             }
         };

         // Tell room we are ready
         newSocket.emit("client-ready", appointmentId);

         // --- Signaling ---
         newSocket.on("user-connected", async () => {
             setStatus("Client joined. Connecting...");
             const offer = await peer.createOffer();
             await peer.setLocalDescription(offer);
             newSocket.emit("offer", { offer, roomId: appointmentId });
         });

         newSocket.on("offer", async ({ offer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(offer));
             const answer = await peer.createAnswer();
             await peer.setLocalDescription(answer);
             newSocket.emit("answer", { answer, roomId: appointmentId });
             processIceQueue();
         });

         newSocket.on("answer", async ({ answer }) => {
             await peer.setRemoteDescription(new RTCSessionDescription(answer));
             processIceQueue();
         });

         newSocket.on("ice-candidate", async ({ candidate }) => {
             if (peer.remoteDescription) {
                 await peer.addIceCandidate(new RTCIceCandidate(candidate));
             } else {
                 iceQueueRef.current.push(candidate);
             }
         });

         // --- Whiteboard Sync (Send State to New User) ---
         newSocket.on("wb-request-state", ({ requesterId }) => {
             if (canvasRef.current) {
                 const image = canvasRef.current.toDataURL();
                 newSocket.emit("wb-send-state", { roomId: appointmentId, image, requesterId });
             }
         });

      } catch (err) {
          console.error("Media Error:", err);
          setStatus("Error: " + err.message);
      }
    };

    const processIceQueue = async () => {
        if (!peerRef.current) return;
        while (iceQueueRef.current.length > 0) {
            const c = iceQueueRef.current.shift();
            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
        }
    };

    init();

    return () => {
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) peerRef.current.close();
    };
  }, [appointmentId]);

  // --- Coordinate Logic (Mouse & Touch) ---
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top) / canvas.height
    };
  };

  // --- Drawing Logic ---
  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getCoords(e);
  };

  const draw = (e) => {
    if (!isDrawing.current || !socketRef.current) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const currPos = getCoords(e);
    
    const drawData = {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: currPos.x,
      y1: currPos.y,
      color: isEraser ? "#ffffff" : activeColor,
      width: isEraser ? 20 : 2,
      roomId: appointmentId
    };

    drawOnCanvas(drawData);
    socketRef.current.emit("wb-draw", drawData);
    lastPos.current = currPos;
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const drawOnCanvas = ({ x0, y0, x1, y1, color, width }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  
  const clearBoard = () => {
     if(!socketRef.current) return;
     const canvas = canvasRef.current;
     const ctx = canvas.getContext("2d");
     ctx.fillStyle = "#ffffff";
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     socketRef.current.emit("wb-clear", appointmentId);
  };

  // --- Init Canvas ---
  useEffect(() => {
    const initCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement.offsetWidth;
        canvasRef.current.height = canvasRef.current.parentElement.offsetHeight;
        const ctx = canvasRef.current.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
    window.addEventListener("resize", initCanvas);
    setTimeout(initCanvas, 500);
    return () => window.removeEventListener("resize", initCanvas);
  }, []);

  // --- End Call Logic (PDF & Email) ---
  const handleEndCall = async () => {
    if (!canvasRef.current) return;
    setIsEnding(true);

    try {
      // 1. Capture Canvas
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL("image/png");

      // 2. Create PDF
      const pdf = new jsPDF({ orientation: "landscape" });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      // 3. Upload
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `whiteboard-${appointmentId}.pdf`, { type: "application/pdf" });
      const res = await startUpload([file]);
      
      // 4. Server Action
      if (res && res[0]) {
         await saveAndSendWhiteboard(appointmentId, res[0].url);
      }
    } catch (error) {
      console.error("End Call Error:", error);
    } finally {
      setIsEnding(false);
      window.close(); 
    }
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-900 overflow-hidden">
      
      {/* Left: Interactive Whiteboard */}
      <div className="flex-1 relative bg-white cursor-crosshair touch-none">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/95 backdrop-blur p-2 rounded-lg shadow-xl border border-zinc-200 z-10">
           <div className="text-[10px] font-bold text-zinc-400 mb-1 text-center uppercase tracking-wider">Tools</div>
           {[ { color: "#000000", label: "Black" }, { color: "#ef4444", label: "Red" }, { color: "#3b82f6", label: "Blue" }, { color: "#22c55e", label: "Green" } ].map((item) => (
             <button key={item.color} onClick={() => { setActiveColor(item.color); setIsEraser(false); }} className={cn("p-1.5 rounded-md transition-all", activeColor === item.color && !isEraser ? "bg-zinc-100 ring-2 ring-zinc-400" : "hover:bg-zinc-50")} title={item.label}>
                <PencilIcon color={item.color} />
             </button>
           ))}
           <div className="h-px bg-zinc-200 my-1"></div>
           <button onClick={() => setIsEraser(true)} className={cn("p-2 rounded-md transition-all flex justify-center", isEraser ? "bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-600")} title="Eraser"><EraserIcon /></button>
           <button onClick={clearBoard} className="p-2 rounded-md hover:bg-red-50 text-red-500 flex justify-center transition-colors" title="Clear All"><TrashIcon /></button>
        </div>
      </div>

      {/* Right: Video Stack */}
      <div className="w-80 bg-zinc-950 flex flex-col border-l border-zinc-800">
        <div className="flex-1 relative border-b border-zinc-800 bg-zinc-900">
           <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">Client</span>
           <div className="absolute top-2 right-2 text-xs text-gray-400">{status}</div>
        </div>
        <div className="flex-1 relative bg-zinc-900">
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-zinc-800" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">You</span>
        </div>
        <div className="p-4 bg-zinc-950">
           <Button 
             variant="destructive" 
             className="w-full" 
             onClick={handleEndCall}
             disabled={isEnding}
           >
             {isEnding ? "Saving & Ending..." : "End Call"}
           </Button>
        </div>
      </div>
    </div>
  );
}