import { useEffect, useRef } from "react";
import { Video, PhoneOff } from "lucide-react";

export default function VideoCallModal({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

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

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current.addEventListener("readyToClose", onClose);
    } catch (err) {
      console.error("Jitsi init error:", err);
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
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
        <div ref={containerRef} className="video-call-container" />
      </div>
    </div>
  );
}
