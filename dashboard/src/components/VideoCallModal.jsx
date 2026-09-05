import { useEffect, useRef, useState } from "react";
import { Video, PhoneOff, Loader2 } from "lucide-react";

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [jitsiError, setJitsiError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let api = null;

    async function loadJitsi() {
      if (cancelled) return;
      try {
        // Dynamically load Jitsi External API script
        if (!window.JitsiMeetExternalAPI) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://meet.jit.si/external_api.js";
            script.async = true;
            script.onload = () => { if (!cancelled) resolve(); };
            script.onerror = () => { if (!cancelled) reject(new Error("Failed to load Jitsi SDK")); };
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
        setJitsiReady(true);
      } catch (err) {
        setJitsiError(err.message || "Could not start video call");
      }
    }

    loadJitsi();
    return () => {
      cancelled = true;
      if (api) {
        try { api.dispose(); } catch { /* ignore */ }
      }
      if (document.body.contains(document.querySelector('script[src*="external_api.js"]'))) {
        const s = document.querySelector('script[src*="external_api.js"]');
        if (s) s.remove();
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
          {!jitsiReady && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", flexDirection: "column", gap: 12, color: "var(--text-muted)",
            }}>
              <Loader2 size={32} style={{ animation: "spin 0.8s linear infinite", color: "var(--accent)" }} />
              <p>Connecting to video call...</p>
              {jitsiError && (
                <p style={{ color: "var(--red)", fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Error:</span> {jitsiError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
