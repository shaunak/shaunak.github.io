import React from "react";
import { Link, useParams } from "react-router-dom";
import { getLifeUpdateById } from "./blogposts/lifeUpdates";

function LifeUpdatePage() {
  const params = useParams();
  const id = params.id;

  if (!id) {
    return (
      <div className="App">
        <main className="MainContent">
          <h1 className="typewriter">Life Update</h1>
          <div className="throughLine">
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
              Missing id
            </div>
            <Link
              to="/blog"
              className="iconButton"
              style={{ display: "inline-block", padding: "0.25rem 0.5rem" }}
            >
              Back to Blog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const entry = getLifeUpdateById(id);

  if (!entry) {
    return (
      <div className="App">
        <main className="MainContent">
          <h1 className="typewriter">Not Found</h1>
          <div className="throughLine">
            <div style={{ marginBottom: "0.75rem" }}>
              No life update found for id: <span style={{ fontWeight: 700 }}>{id}</span>
            </div>
            <Link
              to="/blog"
              className="iconButton"
              style={{ display: "inline-block", padding: "0.25rem 0.5rem" }}
            >
              Back to Blog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const Post = entry.Component;

  return (
    <div className="App">
      <main className="MainContent">
        <h1 className="typewriter">{entry.title}</h1>
        <div className="buttonContainer" style={{ gridRow: 2 }}>
          <Link
            to="/blog"
            className="iconButton"
            style={{ display: "inline-block", padding: "0.25rem 0.5rem" }}
          >
            Back
          </Link>
        </div>
        <div className="throughLine">
          <div style={{ opacity: 0.8, marginBottom: "0.75rem" }}>{entry.date}</div>
          <Post />
        </div>
      </main>
    </div>
  );
}

export default LifeUpdatePage;


