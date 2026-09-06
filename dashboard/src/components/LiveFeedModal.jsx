import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import "./LiveFeedModal.css";

// SIMULATION NOTE: In production, this video tag's src would point to an
// HLS/WebRTC URL produced by a media server that pulls the institute's real
// RTSP feed (rtsp://camera-ip:554/stream1) via ONVIF and transcodes it for
// browser playback. For the hackathon demo, we play a local sample video to
// prove the full pipeline end-to-end without needing physical camera
// hardware, which DoSJE's real infra owns.
//
// ANALYSIS NOTE: The face count + motion numbers below are REAL, computed
// live from the actual video frames in the browser (face-api.js TinyFaceDetector
// + canvas frame-differencing) — not random or scripted. This is a genuine
// first pass at the "AI anomaly detection" layer, not the finished, trained
// fraud-detection model described in the full pitch.

let modelsLoadedPromise = null;
function loadModels() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  }
  return modelsLoadedPromise;
}

export default function LiveFeedModal({ institute, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const intervalRef = useRef(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [analysis, setAnalysis] = useState({ faces: 0, motionPct: 0, samples: 0 });

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadModels().then(() => {
      if (!cancelled) setModelsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!modelsReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    // Small analysis buffer — doesn't need to match display size, keeps
    // detection fast enough to run several times a second on a laptop CPU.
    const ANALYSIS_W = 320;
    const ANALYSIS_H = 180;
    canvas.width = ANALYSIS_W;
    canvas.height = ANALYSIS_H;

    async function analyzeFrame() {
      if (video.readyState < 2) return; // not enough data yet

      ctx.drawImage(video, 0, 0, ANALYSIS_W, ANALYSIS_H);

      // 1) Real face detection on the current frame
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      );

      // 2) Real motion detection vs the previous sampled frame
      const frame = ctx.getImageData(0, 0, ANALYSIS_W, ANALYSIS_H);
      let motionPct = 0;
      if (prevFrameRef.current) {
        let changed = 0;
        const cur = frame.data;
        const prev = prevFrameRef.current.data;
        // Compare luma-ish brightness per pixel (sampled, not every channel,
        // to keep this cheap enough for 3-4 times/sec in the main thread).
        for (let i = 0; i < cur.length; i += 16) {
          const diff = Math.abs(cur[i] - prev[i]);
          if (diff > 25) changed++;
        }
        motionPct = (changed / (cur.length / 16)) * 100;
      }
      prevFrameRef.current = frame;

      setAnalysis((prevState) => ({
        faces: detections.length,
        motionPct: Math.round(motionPct * 10) / 10,
        samples: prevState.samples + 1,
      }));

      // Draw boxes on the visible overlay canvas for the "you can see it
      // thinking" effect — genuinely tied to what detectAllFaces returned.
      ctx.clearRect(0, 0, ANALYSIS_W, ANALYSIS_H);
      ctx.strokeStyle = "#c9822f";
      ctx.lineWidth = 2;
      detections.forEach((d) => {
        ctx.strokeRect(d.box.x, d.box.y, d.box.width, d.box.height);
      });
    }

    intervalRef.current = setInterval(analyzeFrame, 350);
    return () => clearInterval(intervalRef.current);
  }, [modelsReady]);

  if (!institute) return null;

  const expectedStaff = institute.expected_staff || 5;
  const understaffed = analysis.samples > 3 && analysis.faces < expectedStaff * 0.5;
  const lowActivity = analysis.samples > 3 && analysis.motionPct < 1;

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
          <canvas ref={canvasRef} className="feed-analysis-canvas" />
          <span className="feed-live-badge">
            <span className="feed-live-dot" /> SIMULATED FEED
          </span>
        </div>

        <div className="feed-analysis-panel">
          <p className="feed-analysis-title">
            {modelsReady ? "Live analysis (real, running now)" : "Loading detection model\u2026"}
          </p>
          {modelsReady && (
            <div className="feed-analysis-stats">
              <div className="feed-stat">
                <span className="feed-stat__value">{analysis.faces}</span>
                <span className="feed-stat__label">faces detected</span>
              </div>
              <div className="feed-stat">
                <span className="feed-stat__value">{analysis.motionPct}%</span>
                <span className="feed-stat__label">motion this frame</span>
              </div>
              <div className="feed-stat">
                <span className="feed-stat__value">{analysis.samples}</span>
                <span className="feed-stat__label">frames analyzed</span>
              </div>
            </div>
          )}
          {modelsReady && (understaffed || lowActivity) && (
            <p className="feed-analysis-flag">
              {understaffed && `\u26A0 Fewer faces on camera than the ${expectedStaff} expected staff. `}
              {lowActivity && "\u26A0 Very little motion detected."}
            </p>
          )}
        </div>

        <p className="feed-note">
          Face count and motion above are computed live in your browser from this
          video's actual frames (face-api.js + canvas analysis) &mdash; not scripted.
          In production the same analysis runs on the institute's real ONVIF/RTSP
          feed; only the video source changes, not this pipeline.
        </p>
      </div>
    </div>
  );
}
