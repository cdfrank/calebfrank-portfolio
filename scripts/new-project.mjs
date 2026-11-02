#!/usr/bin/env node
// Adds a project: npm run new -- "Client" "Project title"
import { existsSync, writeFileSync } from 'node:fs';

const [client, title] = process.argv.slice(2);
if (!client || !title) {
  console.error('Usage: npm run new -- "Client" "Project title"');
  process.exit(1);
}
const slug = `${client} ${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = `src/content/work/${slug}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}
writeFileSync(file, `---
title: ${JSON.stringify(title)}
client: ${JSON.stringify(client)}
employer: "MRM//McCann"
role: "Product design lead"
start: ${new Date().getFullYear()}
industry: "Agency"
disciplines: ["UX"]
summary: "One sentence on what changed."
draft: true
---
`);
console.log(`Created ${file}. Fill it in, then remove the draft line.`);
