import { useMemo } from "react";

const POSITIVE_WORDS = ["good", "great", "excellent", "satisfied", "helpful", "resolved", "improved", "better", "happy", "thank", "thanks", "appreciate", "well", "proper", "regular", "available"];
const NEGATIVE_WORDS = ["absent", "fake", "fraud", "bad", "poor", "terrible", "worst", "complaint", "problem", "issue", "not", "no", "never", "missing", "broken", "leaking", "misbehave", "rude", "delay", "late", "scam", "cheat", "proxy", "false", "wrong"];
const CATEGORY_KEYWORDS = {
  "Staff Absence": ["teacher", "staff", "absent", "not come", "not coming", "missing", "proxy", "hollow"],
  "Attendance Fraud": ["attendance", "fake", "100 but", "register", "count", "number", "fake attendance"],
  "Service Quality": ["mid-day meal", "food", "service", "receive", "received", "quality"],
  "Infrastructure": ["roof", "building", "classroom", "leaking", "broken", "repair", "infrastructure", "toilet", "water"],
  "Misbehavior": ["misbehav", "rude", "abuse", "harass", "behave"],
  "Financial Fraud": ["money", "fund", "financial", "payment", "salary", "corrupt"],
};

function analyzeSentiment(text) {
  if (!text) return { score: 0, label: "neutral", confidence: 0 };
  const words = text.toLowerCase().split(/\s+/);
  let pos = 0, neg = 0;
  words.forEach((w) => {
    if (POSITIVE_WORDS.some((p) => w.includes(p))) pos++;
    if (NEGATIVE_WORDS.some((n) => w.includes(n))) neg++;
  });
  const total = pos + neg || 1;
  const score = (pos - neg) / total;
  const confidence = Math.min(total / words.length * 2, 1);
  if (score > 0.2) return { score: score.toFixed(2), label: "positive", confidence: (confidence * 100).toFixed(0) };
  if (score < -0.2) return { score: score.toFixed(2), label: "negative", confidence: (confidence * 100).toFixed(0) };
  return { score: score.toFixed(2), label: "neutral", confidence: (confidence * 100).toFixed(0) };
}

function classifyComplaint(text) {
  if (!text) return "Other";
  const lower = text.toLowerCase();
  let bestCategory = "Other";
  let bestScore = 0;
  Object.entries(CATEGORY_KEYWORDS).forEach(([cat, keywords]) => {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestCategory = cat; }
  });
  return bestCategory;
}

export default function SentimentAnalyzer({ complaints }) {
  const analyzed = useMemo(() => {
    return complaints.map((c) => ({
      ...c,
      sentiment: analyzeSentiment(c.description),
      ai_category: classifyComplaint(c.description),
    }));
  }, [complaints]);

  const stats = useMemo(() => {
    const pos = analyzed.filter((c) => c.sentiment.label === "positive").length;
    const neg = analyzed.filter((c) => c.sentiment.label === "negative").length;
    const neu = analyzed.length - pos - neg;
    const categories = {};
    analyzed.forEach((c) => { categories[c.ai_category] = (categories[c.ai_category] || 0) + 1; });
    return { positive: pos, negative: neg, neutral: neu, total: analyzed.length, categories };
  }, [analyzed]);

  return (
    <div className="sentiment-section">
      <div className="sentiment-stats">
        <div className="sentiment-stat" style={{ borderLeft: "3px solid var(--accent-green)" }}>
          <div className="sentiment-stat-val" style={{ color: "var(--accent-green)" }}>{stats.positive}</div>
          <div className="sentiment-stat-lbl">Positive</div>
        </div>
        <div className="sentiment-stat" style={{ borderLeft: "3px solid var(--accent-red)" }}>
          <div className="sentiment-stat-val" style={{ color: "var(--accent-red)" }}>{stats.negative}</div>
          <div className="sentiment-stat-lbl">Negative</div>
        </div>
        <div className="sentiment-stat" style={{ borderLeft: "3px solid var(--text-muted)" }}>
          <div className="sentiment-stat-val">{stats.neutral}</div>
          <div className="sentiment-stat-lbl">Neutral</div>
        </div>
      </div>

      <div className="sentiment-categories">
        <h4>AI-Classified Categories</h4>
        <div className="category-grid">
          {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="category-item">
              <span className="category-name">{cat}</span>
              <span className="category-count">{count}</span>
              <div className="category-bar">
                <div className="category-bar-fill" style={{ width: `${(count / stats.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sentiment-list">
        {analyzed.slice(0, 10).map((c) => (
          <div key={c.id} className="sentiment-item">
            <div className="sentiment-item-header">
              <span className={`sentiment-label sentiment-${c.sentiment.label}`}>{c.sentiment.label.toUpperCase()}</span>
              <span className="sentiment-confidence">{c.sentiment.confidence}% confidence</span>
            </div>
            <p className="sentiment-text">{c.description}</p>
            <div className="sentiment-item-meta">
              <span>{c.institute_name}</span>
              <span className="sentiment-category">{c.ai_category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
