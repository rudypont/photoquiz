import React, { useEffect, useMemo, useState } from "react";
import "./app.css";

type Photo = { file: string; name: string };
type QuizItem = { correct: Photo; options: Photo[] };

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
  const pool = all.filter((p) => p.name !== correct.name);
  return shuffle(pool).slice(0, 2);
}

function usePreloadImages(urls: string[]) {
  useEffect(() => {
    const imgs = urls.map((u) => {
      const img = new Image();
      img.src = u;
      return img;
    });
    return () => {
      imgs.forEach((i) => (i.src = ""));
    };
  }, [urls]);
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Load photos list
  useEffect(() => {
    fetch("/photos/photos.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((list: Photo[]) => {
        if (!Array.isArray(list) || list.length < 3)
          throw new Error("Need at least 3 photos.");
        setPhotos(list);
      })
      .catch((e) => setError(`Could not load photos: ${e.message}`));
  }, []);

  // Build a new quiz when photos are ready and user starts
  function startQuiz() {
    if (!photos || photos.length < 3) return;
    const picks =
      photos.length >= QUESTIONS
        ? shuffle(photos).slice(0, QUESTIONS)
        : shuffle(photos);
    const items: QuizItem[] = picks.map((correct) => {
      const distractors = getTwoDistractors(photos, correct);
      const options = shuffle([correct, ...distractors]); // fixed now
      return { correct, options };
    });
    setQuiz(items);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  // Preload current & next images
  const imagesToPreload = useMemo(() => {
    if (!quiz) return [];
    return [quiz[current]?.correct.file, quiz[current + 1]?.correct.file].filter(
      Boolean
    ) as string[];
  }, [quiz, current]);
  usePreloadImages(imagesToPreload);

  if (error) return <Center><p role="alert">{error}</p></Center>;
  if (!photos) return <Center><p>Loading…</p></Center>;

  // Start screen
  if (!quiz && !finished) {
    return (
      <Center>
        <div className="card">
          <h1>Profile Photo Quiz</h1>
          <p>10 questions. Pick the correct name for each photo.</p>
          <button className="primary" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </Center>
    );
  }

  // End screen
  if (finished || (quiz && current >= quiz.length)) {
    return (
      <Center>
        <div className="card">
          <h2>Done!</h2>
          <p>
            Your score: <strong>{score}</strong> / {quiz?.length ?? QUESTIONS}
          </p>
          <button className="primary" onClick={startQuiz}>Play again</button>
        </div>
      </Center>
    );
  }

  // Question screen
  const item = quiz![current];
  const correctName = item.correct.name;
  const answered = selected !== null;

  function handlePick(name: string) {
    if (answered) return;
    setSelected(name);
    if (name === correctName) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 >= (quiz?.length ?? 0)) {
      setFinished(true);
      setSelected(null);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  return (
    <Center>
      <div className="card">
        <div className="top">
          <span>
            Question {current + 1} / {quiz!.length}
          </span>
          <span>Score: {score}</span>
        </div>

        <div className="image-wrap">
          <img src={item.correct.file} alt={`Profile of ${item.correct.name}`} />
        </div>

        <div className="options">
          {item.options.map((opt) => {
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
            <button className="primary" onClick={next}>
              Next
            </button>
          </div>
        )}
      </div>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg,#f8fafc,#eef6ff)",
      }}
    >
      {children}
    </div>
  );
}
