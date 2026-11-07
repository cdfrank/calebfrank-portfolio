// Generated from the Claude Design board CaseStudy-pyje.dc.html. The logic class is the board's own code.
import React from 'react';

class DCLogic extends React.Component {
  constructor(props) { super(props); this.state = {}; }
}

class Component extends DCLogic {
  renderVals() { return {}; }
}

export default class Board extends Component {
  render() {
    const v = this.renderVals();
    return (
      <>
      {" "}
      <div className={"site"}>
        {" "}
        <section className={"paper"}>
          {" "}
          <div className={"wrap nav"}>
            {" "}
            <a className={"back"} href={"/work/"}>
              <span aria-hidden={"true"}>
                {"←"}
              </span>
              {" All work"}
            </a>
            {" "}
            <a href={"/"} aria-label={"Dooane, home"}>
              <img src={"/v2/fbe450132c9926658233b780d325d119.png"} alt={"Dooane"} style={{"height": "52px", "display": "block"}} />
            </a>
            {" "}
          </div>
          {" "}
          <div className={"wrap hero"}>
            {" "}
            <div>
              {" "}
              <h1 className={"display"}>
                {"NY Lottery"}
                <br />
                {"Digital "}
                <img src={"/v2/4e49fcf2ea678f6f02136b5c1baeaa8a.png"} alt={"Playslip"} />
              </h1>
              {" "}
              <p style={{"fontSize": "21px", "lineHeight": "1.5", "maxWidth": "520px", "margin": "22px 0 20px"}}>
                {"A paper form every player knows became a mobile flow that ends in a QR code at the retailer."}
              </p>
              {" "}
              <div style={{"display": "flex", "gap": "6px", "flexWrap": "wrap"}}>
                {" "}
                <span className={"tag"}>
                  {"Mobile"}
                  <i className={"drip"} style={{"left": "22%", "top": "82%", "height": "12px"}}></i>
                  <i className={"drip"} style={{"left": "71%", "top": "78%", "height": "18px"}}></i>
                </span>
                <span className={"tag"}>
                  {"Service design"}
                  <i className={"drip"} style={{"left": "40%", "top": "80%", "height": "15px"}}></i>
                </span>
                <span className={"tag"}>
                  {"Research"}
                  <i className={"drip"} style={{"left": "18%", "top": "80%", "height": "9px"}}></i>
                  <i className={"drip"} style={{"left": "80%", "top": "76%", "height": "14px"}}></i>
                </span>
                <span className={"tag"}>
                  {"2021 to 2024"}
                  <i className={"drip"} style={{"left": "58%", "top": "80%", "height": "11px"}}></i>
                </span>
                {" "}
              </div>
              {" "}
            </div>
            {" "}
            <div className={"shot"}>
              {" "}
              <img className={"sp"} src={"/v2/8dc45d9cf1c0ca0805c4934ada319bd6.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <img className={"m"} src={"/v2/04eadf151721aaaf1005bbe69761a593.jpg"} alt={"The Digital Playslip in progress, with numbered questions and a running total"} />
              {" "}
              <img className={"ey"} src={"/v2/7f47870f9f9493d67968b62037c983c8.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <img className={"cr"} src={"/v2/2634edd24a6dc2536077d5aa3a73fc1d.png"} alt={""} aria-hidden={"true"} />
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <div className={"wrap facts"}>
          {" "}
          <div className={"muted"}>
            <b>
              {"10"}
            </b>
            {"draw games on one pattern"}
          </div>
          {" "}
          <div className={"muted"}>
            <b>
              {"12"}
            </b>
            {"languages across the site"}
          </div>
          {" "}
          <div className={"muted"}>
            <b>
              {"5 yrs"}
            </b>
            {"agency-of-record deal won in 2022"}
          </div>
          {" "}
          <div className={"muted"}>
            <b>
              {"Lead"}
            </b>
            {"Product design, with MRM//McCann"}
          </div>
          {" "}
        </div>
        {" "}
        <section className={"wrap block"}>
          {" "}
          <div>
            {" "}
            <h2 className={"display"} id={"s1"}>
              <span className={"stepn"} aria-hidden={"true"}>
                {"1"}
                <i className={"drip"} style={{"left": "58%", "top": "84%", "height": "14px"}}></i>
              </span>
              {"The form was the system"}
            </h2>
            {" "}
            <p>
              {"Every lottery player in New York knows the paper playslip. It has rules and options printed in tiny type, and it varies from game to game."}
            </p>
            {" "}
            <p className={"muted"}>
              {"A single Quick Draw slip asks how many spots to play, which numbers, how much per draw, whether to add extras, and how many draws. The design had to handle all 10 draw games with one pattern, and respect compliance, responsible play, and a wide range of ages and abilities."}
            </p>
            {" "}
          </div>
          {" "}
          <img className={"fig tall"} src={"/v2/09cbaa1e1dc444e0320ab0789d2d2db5.jpg"} alt={"The paper Quick Draw playslip, with numbered steps printed down a dense orange form"} />
          {" "}
        </section>
        {" "}
        <section className={"wrap block flip"}>
          {" "}
          <div>
            {" "}
            <h2 className={"display"} id={"s2"}>
              <span className={"stepn"} aria-hidden={"true"}>
                {"2"}
                <i className={"drip"} style={{"left": "58%", "top": "84%", "height": "10px"}}></i>
              </span>
              {"Numbered steps that unlock"}
            </h2>
            {" "}
            <p>
              {"The first rounds removed color, numbered each decision, and made steps unlock in sequence. A footer kept a running total, so the cost of a play was never a surprise."}
            </p>
            {" "}
            <p className={"muted"}>
              {"Dropdowns became checkboxes where there were only a few options, because one less tap matters when you are standing in a store."}
            </p>
            {" "}
          </div>
          {" "}
          <img className={"fig"} src={"/v2/4c5937eea6aabd54ef615541dc24a40f.jpg"} alt={"An add-on step in the Digital Playslip, offering Party Play and Money Dots"} />
          {" "}
        </section>
        {" "}
        <section className={"wrap"} style={{"paddingTop": "24px", "paddingBottom": "72px"}}>
          {" "}
          <p className={"quote"}>
            {"Compliance was a design material here, not a blocker."}
          </p>
          {" "}
        </section>
        {" "}
        <section className={"paper"} style={{"paddingTop": "clamp(56px,7vw,96px)", "paddingBottom": "clamp(56px,7vw,96px)"}}>
          {" "}
          <div className={"wrap"}>
            {" "}
            <div style={{"maxWidth": "760px", "marginBottom": "36px"}}>
              {" "}
              <h2 className={"display"} style={{"fontSize": "clamp(40px,4.6vw,66px)", "marginBottom": "18px"}} id={"s3"}>
                <span className={"stepn"} aria-hidden={"true"}>
                  {"3"}
                  <i className={"drip"} style={{"left": "58%", "top": "84%", "height": "16px"}}></i>
                </span>
                {"Testing with the game people know"}
              </h2>
              {" "}
              <p style={{"margin": "0"}}>
                {"We moved user testing to Powerball, because heavy and casual players both know it. That shaped a custom number board, a clearer Quick Pick, and a summary page where players can review a play before it counts. The flow ends with a QR code, so the store remains part of the experience."}
              </p>
              {" "}
            </div>
            {" "}
            <div className={"phones"}>
              {" "}
              <img src={"/v2/cd190b39f02379b11b83d1dfe66d2f47.jpg"} alt={"Mobile Scratch-Off games page"} />
              {" "}
              <img src={"/v2/4c99038e7852f632e46329ef9bf14b4f.jpg"} alt={"Mobile Quick Draw results page"} />
              {" "}
              <img src={"/v2/32550524ce326f9c1ce204455cbd7c42.jpg"} alt={"Mobile how-to-play guide"} />
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"wrap block"}>
          {" "}
          <div>
            {" "}
            <h2 className={"display"} id={"s4"}>
              <span className={"stepn"} aria-hidden={"true"}>
                {"4"}
                <i className={"drip"} style={{"left": "58%", "top": "84%", "height": "12px"}}></i>
              </span>
              {"What changed"}
            </h2>
            {" "}
            <p>
              {"The team had no real design system when I arrived, only a one-page guide. It left with a unified library and a shared way of working, and designers I mentored took on more of the strategic thinking."}
            </p>
            {" "}
            <p className={"muted"}>
              {"Good digital versions of physical rituals keep what people already trust and remove the rest."}
            </p>
            {" "}
          </div>
          {" "}
          <img className={"fig"} src={"/v2/ff3d3a6e23226754c64ca07af1037208.jpg"} alt={"New York Lottery homepage with draw game results"} style={{"maxHeight": "520px", "objectFit": "cover", "objectPosition": "top"}} />
          {" "}
        </section>
        {" "}
        <section className={"wrap"} style={{"paddingBottom": "40px"}}>
          {" "}
          <a className={"next"} href={"/work/#wall"}>
            {" "}
            <img className={"np"} src={"/v2/2b0a49fcd7d47662999b75aa3816a1df.jpg"} alt={"Angled SalesX screens showing a territory map, customer accounts, and sales charts"} />
            {" "}
            <span className={"nb"}>
              <img className={"bot"} src={"/v2/04090179b1b33cc067ebb8191c3e6f95.png"} alt={""} />
              <span className={"k"}>
                {"Bit · up next"}
              </span>
              <b>
                {"SalesX for BASF Agriculture"}
              </b>
              <span>
                {"One platform replaced scattered tools. Or go see the other 92 on the wall."}
              </span>
            </span>
            {" "}
          </a>
          {" "}
        </section>
        {" "}
        <nav className={"slip"} aria-label={"Steps in this case study"}>
          {" "}
          <span className={"sk"}>
            {"Playslip"}
          </span>
          {" "}
          <a href={"#s1"}>
            {"1"}
          </a>
          <a href={"#s2"}>
            {"2"}
          </a>
          <a href={"#s3"}>
            {"3"}
          </a>
          <a href={"#s4"}>
            {"4"}
          </a>
          {" "}
          <span className={"tot"}>
            {"Running total: 10 games · 12 languages · 1 pattern"}
          </span>
          {" "}
        </nav>
        {" "}
        <div className={"wrap"} style={{"display": "flex", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap", "paddingBottom": "72px"}}>
          {" "}
          <a className={"btn btn-line"} href={"/work/"}>
            <span aria-hidden={"true"}>
              {"←"}
            </span>
            {" All work"}
          </a>
          {" "}
          <a className={"btn btn-red"} href={"/#contact"}>
            {"Let's talk "}
            <span aria-hidden={"true"}>
              {"→"}
            </span>
          </a>
          {" "}
        </div>
        {" "}
      </div>
      {" "}
      </>
    );
  }
}
