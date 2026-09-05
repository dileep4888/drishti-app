import { useEffect, useRef, useState, useCallback } from "react";
import { Video, PhoneOff, Loader2 } from "lucide-react";

const JITSI_SCRIPT = "https://meet.jit.si/external_api.js";

function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${JITSI_SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = JITSI_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    // If a previous modal open already loaded the script, its "load" event has
    // already fired — poll for the global instead of waiting for a dead event.
    if (script.dataset.loaded === "true" || window.JitsiMeetExternalAPI) {
      script.dataset.loaded = "true";
      return resolve();
    }
    let tries = 0;
    const poll = setInterval(() => {
      tries += 1;
      if (window.JitsiMeetExternalAPI) {
        clearInterval(poll);
        script.dataset.loaded = "true";
        resolve();
      } else if (tries > 40) { // ~20s timeout
        clearInterval(poll);
        reject(new Error("Jitsi SDK load timed out"));
      }
    }, 500);
    script.addEventListener("load", () => {
      clearInterval(poll);
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => {
      clearInterval(poll);
      reject(new Error("Failed to load Jitsi SDK"));
    });
  });
}

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const initJitsi = useCallback(() => {
    setStatus("loading");
    loadJitsiScript()
      .then(() => {
        if (!containerRef.current) return;
        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
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
        });
        apiRef.current.addEventListener("readyToClose", onClose);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Jitsi load error:", err);
        setStatus("error");
      });
  }, [roomName, displayName, onClose]);

  useEffect(() => {
    let cancelled = false;
    initJitsi();
    return () => {
      cancelled = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
        apiRef.current = null;
      }
    };
  }, [initJitsi]);

  return (
    <div className="video-call-overlay" onClick={onClose}>
      <div className="video-call-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-call-header">
          <span className="video-call-title"><Video size={16} /> Video Call — {roomName}</span>
          <button className="video-call-close" onClick={onClose}><PhoneOff size={14} /> End Call</button>
        </div>
        <div ref={containerRef} className="video-call-container" />
        {status === "loading" && (
          <div className="video-call-status">
            <Loader2 size={22} className="vc-spin" />
            <p>Connecting to video call…</p>
          </div>
        )}
        {status === "error" && (
          <div className="video-call-status">
            <p>Could not start the video call. Check your internet connection and allow camera/mic access.</p>
            <button className="btn-outline" onClick={initJitsi}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
