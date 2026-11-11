// Generated from the Claude Design board Play-by5a.dc.html. The logic class is the board's own code.
import React from 'react';

class DCLogic extends React.Component {
  constructor(props) { super(props); this.state = {}; }
}

class Component extends DCLogic {
  renderVals() {
    return {
      items: [
        { t: 'SkateGO', st: 'In progress', d: 'A skate app built in Cursor to explore real-world spots.', y: '2025', cls: '' },
        { t: 'Playable Figma Make games', st: 'Playable prototypes', d: 'Escape the Frame, Grinds & Gambles, Kickflip Chaos, Skateshop Empire, and UX Dungeon Crawler.', y: '2025', cls: '' },
        { t: 'Shred & Dice', st: 'Concept', d: 'A skateboarding roguelike built on tricks, dice, and real places.', y: '2025', cls: '' },
        { t: 'Indoor skatepark proposal', st: 'Proposal', d: 'A proposal for a year-round skate and creative space in Ann Arbor.', y: '2024', cls: 'pp' },
        { t: 'Tin Minnows Bearings Co.', st: 'Concept', d: 'Skateboard bearings in collectible tins inspired by vintage fish packaging.', y: '2024 to 2026', cls: '' },
        { t: 'Design System Scanner', st: 'Prototype', d: 'A small tool for inspecting design systems.', y: '2025', cls: '' },
        { t: 'Portfolios Please', st: 'Concept', d: 'A game concept with character art and a pitch deck.', y: '2025', cls: '' },
        { t: 'TART', st: 'Concept', d: 'A payment gateway concept for charitable giving across traditional and Web3 payments.', y: '2024 to 2025', cls: '' },
      ],
    };
  }
}

export default class Board extends Component {
  render() {
    const v = this.renderVals();
    return (
      <>
      {" "}
      <div className={"site"}>
        {" "}
        <div className={"wrap nav"}>
          {" "}
          <a href={"/"} aria-label={"Dooane, home"}>
            <img src={"/v2/fbe450132c9926658233b780d325d119.png"} alt={"Dooane"} />
          </a>
          {" "}
          <nav className={"links"} aria-label={"Main"}>
            {" "}
            <a href={"/work/"}>
              {"Work"}
            </a>
            {" "}
            <a href={"/about/"}>
              {"About"}
            </a>
            {" "}
            <a href={"/process/"}>
              {"Process"}
            </a>
            {" "}
            <a className={"on"} href={"/play/"}>
              {"Play"}
            </a>
            {" "}
            <a href={"/#contact"}>
              {"Contact"}
            </a>
            {" "}
          </nav>
          {" "}
        </div>
        {" "}
        <header className={"wrap top"}>
          {" "}
          <div>
            {" "}
            <h1 className={"display"}>
              {"Play."}
            </h1>
            {" "}
            <p style={{"fontSize": "21px", "lineHeight": "1.5", "maxWidth": "520px", "margin": "16px 0 0"}}>
              {"Ventures, games, and experiments I make because I want to see if they work. Most are skate-shaped. Most are unfinished, on purpose."}
            </p>
            {" "}
          </div>
          {" "}
          <div className={"pic"}>
            {" "}
            <img className={"sp"} src={"/v2/8dc45d9cf1c0ca0805c4934ada319bd6.png"} alt={""} aria-hidden={"true"} />
            {" "}
            <img className={"p"} src={"/v2/900c9167eeb3c5dcdcd57ec9b99b3a4a.png"} alt={"Halftone photo of a concrete skatepark"} />
            {" "}
            <img className={"m"} src={"/dooane/pointing.webp"} alt={""} aria-hidden={"true"} />
            {" "}
          </div>
          {" "}
        </header>
        {" "}
        <section className={"wrap"} aria-label={"Featured game"}>
          {" "}
          <a className={"feat ssf"} href={"https://skate-spotter-teal.vercel.app"} target={"_blank"} rel={"noopener"}>
            {" "}
            <div className={"vid"}>
              {" "}
              <video src={"/v2/street-signal/dev-cut.mp4"} poster={"/v2/street-signal/dev-cut.jpg"} autoPlay muted loop playsInline preload={"auto"} aria-label={"Street Signal development cut: the real Cranbrook stair set in Michigan, then the same spot as playable gameplay"}></video>
              {" "}
              <span className={"live"}>
                {"Playable now"}
              </span>
              {" "}
            </div>
            {" "}
            <div className={"txt"}>
              {" "}
              <span className={"st"}>
                {"Featured"}
              </span>
              {" "}
              <h2 className={"display"}>
                {"Street Signal"}
              </h2>
              {" "}
              <p className={"muted"} style={{"margin": "0"}}>
                {"Scan a real skate spot, then skate it. Real spots rebuilt as playable lines, starting with Ann Arbor Skatepark and the Cranbrook stair set. Board control, tricks and grinds. Built in Cursor."}
              </p>
              {" "}
              <span className={"go"}>
                {"Play it in your browser →"}
              </span>
              {" "}
              <span className={"k"}>
                {"Opens the live build in a new tab. Keyboard, controller or touch."}
              </span>
              {" "}
            </div>
            {" "}
          </a>
          {" "}
        </section>
        {" "}
        <main className={"wrap grid"}>
          {" "}
          {(v.items || []).map((it, i0) => (
            <React.Fragment key={i0}>
              <article className={`item ${it.cls}`}>
                {" "}
                <span className={"st"}>
                  {`${it.st}`}
                </span>
                {" "}
                <h2 className={"display"}>
                  {`${it.t}`}
                </h2>
                {" "}
                <p className={"muted"} style={{"margin": "0"}}>
                  {`${it.d}`}
                </p>
                {" "}
                <span className={"yr"}>
                  {`${it.y}`}
                </span>
                {" "}
              </article>
            </React.Fragment>
          ))}
          {" "}
        </main>
        {" "}
      </div>
      {" "}
      </>
    );
  }
}
