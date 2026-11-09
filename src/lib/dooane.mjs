export const suggestions = ['Show me the work', 'What does Caleb do?', 'How can I reach him?'];

export const greeting = {
  text: "Hey, I’m DOOANE. I know my way around Caleb’s work. Looking for a project, his experience, or a way to get in touch?",
  links: [],
};

export function publicProjects(work) {
  return work.filter(({ data }) => data.approved !== false && !data.draft && !data.confidential).map(({ id, data }) => ({
    title: data.title, client: data.client, summary: data.summary, disciplines: data.disciplines,
    featured: data.featured !== undefined,
    href: data.caseStudy ? `/work/${id}/` : '/work/',
  }));
}

const words = (text) => text.toLowerCase().match(/[a-z0-9]+/g) || [];
const stopWords = new Set(['a', 'an', 'and', 'are', 'about', 'caleb', 'can', 'do', 'does', 'for', 'he', 'his', 'i', 'in', 'is', 'me', 'of', 'on', 'show', 'tell', 'the', 'to', 'what', 'with', 'work', 'you']);
const link = (label, href) => ({ label, href });

// Only the explicitly selected public fields in Dooane.astro reach this guide.
export function answerQuestion(question, portfolio) {
  const q = question.toLowerCase();
  if (/\b(contact|email|reach|hire|hiring|available|availability|consult|consulting|connect)\b/.test(q)) {
    return { text: `${portfolio.availability} The best next step is to email Caleb directly.`, links: [link('Email Caleb', `mailto:${portfolio.email}`), link('LinkedIn', portfolio.linkedin)] };
  }
  if (/\b(resume|cv|career|experience|background|roles|history)\b/.test(q)) {
    return { text: portfolio.summary, links: [link('Read the resume', '/resume/'), link('More about Caleb', '/about/')] };
  }
  if (/\b(who is caleb|who's caleb|tell me about caleb)\b/.test(q)) {
    return { text: portfolio.summary, links: [link('Meet Caleb', '/about/'), link('Read the resume', '/resume/')] };
  }
  if (/\b(yourself|mascot|armadillo|dooane|bot|are you (an? )?(ai|human)|who are you)\b/.test(q)) {
    return { text: "I’m DOOANE, Caleb’s armadillo portfolio guide. I use prepared answers and published project summaries to help you find your way around. Caleb himself is one email away.", links: [link('Meet Caleb', '/about/'), link('Email Caleb', `mailto:${portfolio.email}`)] };
  }
  if (/\b(what does caleb do|what do(es)? he do|skills|expertise|approach|process|leadership)\b/.test(q)) {
    return { text: portfolio.summary, links: [link('About Caleb', '/about/'), link('Explore the work', '/work/')] };
  }
  if (/\b(play|games?|experiments?|side projects?|skate|lab)\b/.test(q)) {
    return { text: "There’s a playful side to the portfolio too: independent experiments, games, and ideas beyond client work. Start with Play, or browse the Lab.", links: [link('Explore Play', '/play/'), link('Visit the Lab', '/lab/')] };
  }
  const tokens = [...new Set(words(q).filter((word) => word.length > 2 && !stopWords.has(word)))];
  const ranked = portfolio.projects.map((project) => {
    const client = project.client.toLowerCase();
    const title = project.title.toLowerCase();
    const full = words(`${project.client} ${project.title} ${project.summary} ${project.disciplines.join(' ')}`);
    const score = tokens.reduce((sum, word) => sum + (client.includes(word) ? 5 : title.includes(word) ? 3 : full.includes(word) ? 1 : 0), 0);
    return { project, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || Number(b.project.featured) - Number(a.project.featured) || Number(b.project.href !== '/work/') - Number(a.project.href !== '/work/'));
  if (ranked.length) {
    const chosen = ranked.slice(0, 3).map(({ project }) => project);
    return { text: chosen.length === 1 ? `${chosen[0].client}: ${chosen[0].summary}` : `A few relevant places to start:\n\n${chosen.map((p) => `${p.client} — ${p.summary}`).join('\n\n')}`, links: chosen.map((p) => link(p.title, p.href)) };
  }
  if (/\b(work|projects?|portfolio|case stud(y|ies)|best|featured|start)\b/.test(q)) {
    const featured = portfolio.projects.filter((p) => p.featured).slice(0, 3);
    return { text: "Start with the work. You can browse by client, or jump into a published case study. Ask me about a client or a topic, like research or design systems.", links: [...featured.map((p) => link(p.title, p.href)), link('Browse all work', '/work/')] };
  }
  if (/^(hi|hey|hello|thanks|thank you)[!.\s]*$/.test(q.trim())) return greeting;
  return { text: "I don’t have a prepared answer for that yet. Try a client name, a topic like design systems or research, or ask about Caleb’s experience. For anything else, go straight to Caleb.", links: [link('Browse the work', '/work/'), link('Email Caleb', `mailto:${portfolio.email}`)] };
}
