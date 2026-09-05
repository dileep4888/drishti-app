import { useEffect, useRef, useState } from "react";
import { Video, PhoneOff, Loader2 } from "lucide-react";

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    let api = null;

    async function loadJitsi() {
      if (cancelled) return;
      try {
        // Dynamically load the Jitsi External API script (was missing before — modal stayed blank)
        if (!window.JitsiMeetExternalAPI) {
          await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[src*="external_api.js"]');
            if (existing) {
              existing.addEventListener("load", resolve);
              existing.addEventListener("error", () => reject(new Error("Failed to load Jitsi SDK")));
              return;
            }
            const script = document.createElement("script");
            script.src = "https://meet.jit.si/external_api.js";
            script.async = true;
            script.onload = () => { if (!cancelled) resolve(); };
            script.onerror = () => { if (!cancelled) reject(new Error("Failed to load Jitsi SDK — check your internet connection")); };
            document.body.appendChild(script);
          });
        }
        if (cancelled || !window.JitsiMeetExternalAPI) return;

        const domain = "meet.jit.si";
        const options = {
          roomName: `drishti-${roomName}`,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || "DRISHTI Official" },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_BACKGROUND: "#0a0e1a",
            TOOLBAR_ALWAYS_VISIBLE: true,
          },
        };

        api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;
        api.addEventListener("readyToClose", onClose);
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Jitsi init error:", err);
        if (!cancelled) setStatus("error");
      }
    }

    loadJitsi();
    return () => {
      cancelled = true;
      if (api) {
        try { api.dispose(); } catch { /* ignore */ }
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div className="video-call-overlay" onClick={onClose}>
      <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-call-header">
          <span className="video-call-title"><Video size={16} /> Video Call — {roomName}</span>
          <button className="video-call-close" onClick={onClose}><PhoneOff size={14} /> End Call</button>
        </div>
        <div ref={containerRef} className="video-call-container">
          {status !== "ready" && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", flexDirection: "column", gap: 12, color: "var(--text-muted)",
            }}>
              {status === "loading" ? (
                <>
                  <Loader2 size={32} className="spinner-icon" />
                  <p>Connecting to video call...</p>
                </>
              ) : (
                <>
                  <PhoneOff size={28} style={{ color: "var(--red)" }} />
                  <p>Could not start the video call.</p>
                  <p style={{ fontSize: 12, opacity: 0.7 }}>
                    Check your internet connection, or camera/mic permissions, and try again.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
