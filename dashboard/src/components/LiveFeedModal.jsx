import { useEffect, useRef } from "react";
import "./LiveFeedModal.css";

// SIMULATION NOTE: In production, this video tag's src would point to an
// HLS/WebRTC URL produced by a media server that pulls the institute's real
// RTSP feed (rtsp://camera-ip:554/stream1) via ONVIF and transcodes it for
// browser playback. For the hackathon demo, we play a local sample video to
// prove the full pipeline (assignment -> click -> live view) end-to-end
// without needing physical camera hardware, which DoSJE's real infra owns.
export default function LiveFeedModal({ institute, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!institute) return null;

  return (
    <div className="feed-overlay" onClick={onClose}>
      <div className="feed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feed-header">
          <div>
            <p className="feed-eyebrow">Live CCTV &middot; {institute.district}</p>
            <h3 className="feed-title">{institute.name}</h3>
          </div>
          <button className="feed-close" onClick={onClose} aria-label="Close live feed">
            &times;
          </button>
        </div>

        <div className="feed-video-wrap">
          <video
            ref={videoRef}
            className="feed-video"
            src="/sample-feed.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls
          >
            Your browser does not support embedded video.
          </video>
          <span className="feed-live-badge">
            <span className="feed-live-dot" /> SIMULATED FEED
          </span>
        </div>

        <p className="feed-note">
          Demo playback of a local sample video &mdash; in production this connects
          directly to the institute&apos;s existing ONVIF-compatible CCTV via RTSP,
          relayed through our media server as HLS. No backend or app change needed
          when a real camera is plugged in.
        </p>
      </div>
    </div>
  );
}
