import { useEffect, useRef, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
// @ts-ignore
import resume from './pdfs/ShaunakT_Resume.pdf'
import DenLoop from "./DenLoop";
import "./App.css";
import Blog from "./Blog";
import LifeUpdatePage from "./LifeUpdatePage";
import BlogPostPage from "./BlogPostPage";


function Home() {
  const fullName = "Shaunak\nTulshibagwale";
  const aboutSegments = [
    {
      text: "I'm a software developer based in NYC. I like solving meaningful problems for people. \n\n Currently, I'm a founding engineer at  ",
    },
    { text: "Centralize", href: "https://www.usecentralize.com" },
    { text: ". We're building the relationship selling platform for mid market and enterprise GTM teams. We power GTM for some very large companies like CoreWeave, Brex, Cresta, and many more. \n\n Previously, I was an engineer at " },
    { text: "Gusto", href: "https://gusto.com" },
    { text: " where I launched the AI Platform team. \n\n Before that, I was getting my BSc in CS from UBC. Super beautiful place." },
  ];
  const socialLinks = [
    {
      key: "email",
      label: "email",
      href: "mailto:shaun.tul@gmail.com",
    },
    {
      key: "linkedin",
      label: "linkedin",
      href: "https://www.linkedin.com/in/shaunakt/",
    },
    {
      key: "github",
      label: "github",
      href: "https://www.github.com/shaunak",
    },
    {
      key: "resume",
      label: "resume",
      href: resume,
    },
  ];
  const totalAboutChars = aboutSegments.reduce(
    (total, segment) => total + segment.text.length,
    0
  );
  const totalStreamSteps = fullName.length + socialLinks.length + totalAboutChars;
  const [streamStep, setStreamStep] = useState(0);
  const shouldSkipRef = useRef(false);
  const streamStepRef = useRef(0);
  const titleStepDelayMs = 50;
  const iconStepDelayMs = 200;
  const aboutStepDelayMs = 5;

  useEffect(() => {
    const skipAnimation = () => {
      shouldSkipRef.current = true;
      streamStepRef.current = totalStreamSteps;
      setStreamStep(totalStreamSteps);
    };

    window.addEventListener("pointerdown", skipAnimation);
    window.addEventListener("keydown", skipAnimation);

    return () => {
      window.removeEventListener("pointerdown", skipAnimation);
      window.removeEventListener("keydown", skipAnimation);
    };
  }, [totalStreamSteps]);

  useEffect(() => {
    let animationFrameId = 0;
    let previousTimestamp = 0;
    shouldSkipRef.current = false;
    streamStepRef.current = 0;

    setStreamStep(0);

    const getDelayForStep = (step: number) => {
      if (step < fullName.length) {
        return titleStepDelayMs;
      }
      if (step < fullName.length + socialLinks.length) {
        return iconStepDelayMs;
      }
      return aboutStepDelayMs;
    };

    const animate = (timestamp: number) => {
      if (shouldSkipRef.current) {
        return;
      }

      if (!previousTimestamp) {
        previousTimestamp = timestamp;
      }

      const elapsed = timestamp - previousTimestamp;
      let remainingElapsed = elapsed;
      let didAdvance = false;
      let safetyCounter = 0;

      while (
        streamStepRef.current < totalStreamSteps &&
        remainingElapsed >= getDelayForStep(streamStepRef.current) &&
        safetyCounter < 1000
      ) {
        remainingElapsed -= getDelayForStep(streamStepRef.current);
        streamStepRef.current += 1;
        didAdvance = true;
        safetyCounter += 1;
      }

      if (didAdvance) {
        setStreamStep(streamStepRef.current);
        previousTimestamp = timestamp - remainingElapsed;
      }

      if (streamStepRef.current < totalStreamSteps) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [
    totalStreamSteps,
    fullName.length,
    socialLinks.length,
    titleStepDelayMs,
    iconStepDelayMs,
    aboutStepDelayMs,
  ]);
  const visibleName = fullName.slice(0, Math.min(streamStep, fullName.length));
  const visibleIconCount = Math.min(
    Math.max(streamStep - fullName.length, 0),
    socialLinks.length
  );
  const visibleAboutChars = Math.max(
    streamStep - fullName.length - socialLinks.length,
    0
  );

  let remainingAboutChars = visibleAboutChars;
  const streamedAboutText = aboutSegments.map((segment) => {
    if (remainingAboutChars <= 0) {
      return null;
    }

    const visibleCharsForSegment = Math.min(
      remainingAboutChars,
      segment.text.length
    );
    remainingAboutChars -= visibleCharsForSegment;

    const visibleSegmentText = segment.text.slice(0, visibleCharsForSegment);

    if (segment.href) {
      return (
        <a
          key={segment.href}
          className="link"
          href={segment.href}
          target="_blank"
          rel="noreferrer"
        >
          {visibleSegmentText}
        </a>
      );
    }

    return <span key={segment.text}>{visibleSegmentText}</span>;
  });

  return (
    <div className="App">
      <main className="MainContent">
        <h1 className="typewriter">{visibleName}</h1>
        <div className="buttonContainer">
          {socialLinks.slice(0, visibleIconCount).map((link) => (
            <a
            key={link.key}
            className="link socialLink streamInIcon"
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
            >
            {link.label}
            </a>
          ))}
        </div>
        <div className="throughLine homeThroughLine">{streamedAboutText}</div>
      </main>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/denLoop" element={<DenLoop />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/blog/lifeupdate/:id" element={<LifeUpdatePage />} />
        <Route
          path="/blog/lifeUpdate0"
          element={<Navigate to="/blog/lifeupdate/0" replace />}
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
