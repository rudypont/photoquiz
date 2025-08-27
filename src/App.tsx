
import React, { useEffect, useMemo, useState } from "react";

type Photo = { file: string; name: string };

const QUESTIONS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTwoDistractors(all: Photo[], correct: Photo) {
  const pool = all.filter(p => p.name !== correct.name);
  return shuffle(pool).slice(0, 2);
}

function usePreloadImages(urls: string[]) {
  useEffect(() => {
    const imgs = urls.map(u => {
      const img = new Image();
      img.src = u;
      return img;
    });
    return () => {
      imgs.forEach(i => (i.src = ""));
    };
  }, [urls]);
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch("/photos/photos.json", { cache: "no-cache" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((list: Photo[]) => {
        if (!Array.isArray(list) || list.length < 3)
          throw new Error("Need at least 3 photos.");
        setPhotos(list);
      })
      .catch(e => setError(`Could not load photos: ${e.message}`));
  }, []);

  const questionSet = useMemo(() => {
    if (!photos) return [];
    const pool = photos.length >= QUESTIONS ? shuffle(photos).slice(0, QUESTIONS) : shuffle(photos);
    return pool;
  }, [photos, started]);

  usePreloadImages(questionSet.slice(current, current + 2).map(p => p.file));

  if (error) return <Center><p role="alert">{error}</p></Center>;
  if (!photos) return <Center><p>Loading…</p></Center>;

  // End-of-quiz screen
  if (current >= QUESTIONS) {
    return (
      <Center>
        <div className="card">
          <h2>Done!</h2>
          <p>Your score: <strong>{score}</strong> / {QUESTIONS}</p>
          <button onClick={() => {
            setStarted(false);
            setCurrent(0);
            setSelected(null);
            setScore(0);
          }}>Back to start</button>
        </div>
      </Center>
    );
  }

  if (!started) {
    return (
      <Center>
        <div className="card">
          <h1>Profile Photo Quiz</h1>
          <p>10 questions. Pick the correct name for each photo.</p>
          <button className="primary" onClick={() => {
            setStarted(true);
            setCurrent(0);
            setSelected(null);
            setScore(0);
          }}>Start Quiz</button>
        </div>
      </Center>
    );
  }

  const q = questionSet[current] ?? questionSet[current % questionSet.length];
  const distractors = getTwoDistractors(photos, q);
  const options = shuffle([q, ...distractors]);

  const answered = selected !== null;
  const correctName = q.name;

  function handlePick(name: string) {
    if (answered) return;
    setSelected(name);
    if (name === correctName) setScore(s => s + 1);
  }

  function next() {
    if (current + 1 >= QUESTIONS) {
      setCurrent(QUESTIONS);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  }

  return (
    <Center>
      <div className="card">
        <div className="top">
          <span>Question {current + 1} / {QUESTIONS}</span>
          <span>Score: {score}</span>
        </div>

        <div className="image-wrap">
          <img src={q.file} alt={`Profile of ${q.name}`} />
        </div>

        <div className="options">
          {options.map(opt => {
            const isCorrect = opt.name === correctName;
            const isPicked = selected === opt.name;
            let cls = "btn";
            if (answered) {
              if (isCorrect) cls += " correct";
              else if (isPicked) cls += " wrong";
              else cls += " disabled";
            }
            return (
              <button
                key={opt.name}
                className={cls}
                onClick={() => handlePick(opt.name)}
                disabled={answered}
              >
                {opt.name}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="footer">
            <button className="primary" onClick={next}>Next</button>
          </div>
        )}
      </div>

      <style>{css}</style>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100svh",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(180deg,#f8fafc,#eef6ff)"
    }}>
      {children}
    </div>
  );
}

const css = `.card {
  width: min(720px, 92vw);
  background: white;
  border-radius: 16px;
  padding: 20px 20px 16px;
  box-shadow: 0 10px 30px rgba(2, 132, 199, 0.15);
  display: grid;
  gap: 16px;
}
h1, h2 { margin: 0; }
.top { display: flex; justify-content: space-between; color: #475569; font-size: 14px; }
.image-wrap { width: 100%; aspect-ratio: 1 / 1; background: #f1f5f9; border-radius: 12px; overflow: hidden; display: grid; place-items: center; }
.image-wrap img { width: 100%; height: 100%; object-fit: cover; }
.options { display: grid; gap: 10px; grid-template-columns: 1fr; }
@media (min-width: 560px) {
  .options { grid-template-columns: repeat(3, 1fr); }
}
.btn {
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform .05s ease, background .2s ease, border-color .2s ease;
}
.btn:active { transform: translateY(1px); }
.btn.disabled { opacity: .6; cursor: default; }
.btn.correct { background: #dcfce7; border-color: #22c55e; }
.btn.wrong { background: #fee2e2; border-color: #ef4444; }
.footer { display: flex; justify-content: flex-end; }
button.primary {
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
}
button.primary:hover { filter: brightness(0.95); }\`;
