/*
 * File: src/app/(app)/video-call/[id]/page.js
 * SR-DEV: Expert Video Page (Fixed CORS Connection)
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";

export default function ExpertVideoCallPage() {
  const params = useParams();
  const appointmentId = params.id;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const iceQueue = useRef([]);
  
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!appointmentId) return;

    // ⚠️ CRITICAL: Must connect to User App (Port 3000), NOT Expert App (3001)
    // Change this if your User App is on a different URL
    const SOCKET_URL = "https://3000-firebase-mind-namo-users-1762736047019.cluster-cd3bsnf6r5bemwki2bxljme5as.cloudworkstations.dev"; 

    const init = async () => {
      try {
         // Wake up User Server
         await fetch(`${SOCKET_URL}/api/socket`).catch(() => {});

         const newSocket = io(SOCKET_URL, { 
             path: "/api/socket_io",
             transports: ["websocket", "polling"]
         });
         socketRef.current = newSocket;

         newSocket.emit("join-video", appointmentId);

         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
         if (localVideoRef.current) {
             localVideoRef.current.srcObject = stream;
             localVideoRef.current.muted = true;
         }

         const peer = new RTCPeerConnection({
             iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
         });
         peerRef.current = peer;

         stream.getTracks().forEach(track => peer.addTrack(track, stream));

         peer.ontrack = (event) => {
             console.log("🎥 Expert received remote stream");
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.srcObject = event.streams[0];
                 remoteVideoRef.current.play().catch(console.error);
             }
         };

         peer.onicecandidate = (event) => {
             if (event.candidate) {
                 newSocket.emit("ice-candidate", { candidate: event.candidate, roomId: appointmentId });
             }
         };

         // Tell room we are ready
         newSocket.emit("client-ready", appointmentId);

         // --- SIGNALING ---
         newSocket.on("user-connected", async () => {
             console.log("🔵 User connected. Sending Offer.");
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
                 iceQueue.current.push(candidate);
             }
         });

         // Sync Whiteboard for new joiner
         newSocket.on("wb-request-state", ({ requesterId }) => {
             if (canvasRef.current) {
                 const image = canvasRef.current.toDataURL();
                 newSocket.emit("wb-send-state", { roomId: appointmentId, image, requesterId });
             }
         });

      } catch (err) {
          console.error("Media Error:", err);
          alert("Camera/Mic access denied.");
      }
    };

    const processIceQueue = async () => {
        if(!peerRef.current) return;
        while(iceQueue.current.length > 0) {
            const c = iceQueue.current.shift();
            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e){}
        }
    };

    init();

    return () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) peerRef.current.close();
    };
  }, [appointmentId]);

  // --- Whiteboard Logic ---
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / canvas.width,
      y: (e.clientY - rect.top) / canvas.height
    };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!isDrawing.current || !socketRef.current) return;
    const canvas = canvasRef.current;
    const currPos = getPos(e, canvas);
    const drawData = { x0: lastPos.current.x, y0: lastPos.current.y, x1: currPos.x, y1: currPos.y, color: "#000000", width: 2, roomId: appointmentId };
    drawOnCanvas(drawData);
    socketRef.current.emit("wb-draw", drawData);
    lastPos.current = currPos;
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const drawOnCanvas = ({ x0, y0, x1, y1, color, width }) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
    ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  };
  
  const clearBoard = () => {
     if(!socketRef.current) return;
     const canvas = canvasRef.current;
     canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
     socketRef.current.emit("wb-clear", appointmentId);
  };

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement.offsetWidth;
        canvasRef.current.height = canvasRef.current.parentElement.offsetHeight;
      }
    };
    window.addEventListener("resize", resize);
    setTimeout(resize, 500);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="flex h-[100dvh] bg-zinc-900 overflow-hidden">
      <div className="flex-1 relative bg-white cursor-crosshair">
        <canvas ref={canvasRef} className="block w-full h-full" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
        <div className="absolute top-4 left-4 flex gap-2">
           <div className="bg-black/50 text-white px-3 py-1 rounded text-sm select-none">Expert Whiteboard</div>
           <Button size="sm" variant="destructive" onClick={clearBoard}>Clear Board</Button>
        </div>
      </div>
      <div className="w-80 bg-zinc-950 flex flex-col border-l border-zinc-800">
        <div className="flex-1 relative border-b border-zinc-800 bg-zinc-900">
           <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-black" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">Client</span>
        </div>
        <div className="flex-1 relative bg-zinc-900">
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-zinc-800" />
           <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">You</span>
        </div>
        <div className="p-4 bg-zinc-950">
           <Button variant="destructive" className="w-full" onClick={() => window.close()}>End Call</Button>
        </div>
      </div>
    </div>
  );
}