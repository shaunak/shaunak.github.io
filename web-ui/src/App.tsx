import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import linkedinSymbol from "./linkedin.svg";
import githubSymbol from "./github.svg";
import emailSymbol from "./email.svg";
import resumeIcon from "./resume.svg";
// @ts-ignore
import resume from './pdfs/ShaunakT_Resume.pdf'
import DenLoop from "./DenLoop";
import "./App.css";
import Blog from "./Blog";
import LifeUpdatePage from "./LifeUpdatePage";
import BlogPostPage from "./BlogPostPage";

function Home() {
  const openLink = (url: any) => {
    window.open(url, "_blank");
  };

  return (
    <div className="App">
      <main className="MainContent">
        <h1 className="typewriter">Shaunak <br></br> Tulshibagwale </h1>
        <div className="buttonContainer">
            <button
            className="iconButton"
            onClick={(e) => {
              e.preventDefault();
              window.open("mailto:shaun.tul@gmail.com", "_blank");
            }}
            >
            <img src={emailSymbol as any} className="icon" alt="email" />
            </button>
          <button
            className="iconButton"
            onClick={() => openLink("https://www.linkedin.com/in/shaunakt/")}
          >
            <img src={linkedinSymbol as any} className="icon" alt="linkedin" />
          </button>
          <button
            className="iconButton"
            onClick={() => openLink("https://www.github.com/shaunak")}
          >
            <img src={githubSymbol as any} className="icon" alt="github" />
          </button>
          <button
            className="iconButton"
            onClick={() => window.open(resume, '_blank')}
            // onClick={() => window.open(window.location.href +  'pdf/ShaunakT_Resume.pdf', '_blank')}
          >
            <img src={resumeIcon as any} className="icon" alt="resume" />
          </button>
        </div>
        <div className="throughLine">
          I'm a software developer based in NYC. I like building products that
          make life easier, and that people love to use. Currently, I'm using LLMs to figure out Payroll, Compliance and Taxes on <a className="link" href="https://gusto.com" target="_blank" rel="noreferrer">Gusto's</a> AI Platform Team.
        </div>
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
