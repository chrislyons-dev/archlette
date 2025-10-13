import fs from 'node:fs/promises';
import path from 'node:path';

const files = {
  'aac.yaml': `project:
  name: Example Project
  repo_url: https://github.com/your/repo
docs:
  out_dir: docs/architecture
  adr_dir: docs/adr
inputs:
  iac:
    - type: terraform
      paths: ["iac/**"]
  code:
    - language: ts
      paths: ["services/**", "apps/**"]
      annotations: ["@service", "@endpoint"]
  openapi:
    - "apis/**/openapi*.{yml,yaml,json}"
generators:
  - kind: mermaid-c4
    levels: ["C1", "C2"]
  - kind: plantuml-c4
  - kind: inframap
    workdir: "iac"           # where your TF lives
    output: "infrastructure.dot"
    render_png: true
tools:
  plantuml:
    enabled: true
    jar: ./tools/plantuml.jar
    render: ["-tpng","-tsvg"]
  mermaid:
    enabled: false
    mmdc: mmdc            # enable and ensure @mermaid-js/mermaid-cli is installed
  inframap:
    enabled: false
    cmd: inframap         # enable and ensure inframap is installed
  graphviz:
    dot: dot
publish:
  - kind: gh-pages
    branch: gh-pages
    path: docs/architecture
`,
  'templates/adr-0001.md.hbs': `# ADR-0001: Architecture-as-Code

- **Status:** Accepted
- **Date:** {{date}}
- **Context:** Keep architecture close to code; auto-generate diagrams from sources.
- **Decision:** Use aac.yaml + AAC CLI to generate and publish artifacts.
- **Consequences:** Devs regenerate locally; CI validates; PRs show diffs.
`,
  'templates/diagram-index.md.hbs': `# Architecture Index

Generated diagrams live here.
`,
  'docs/adr/.keep': '',
};

export async function scaffold() {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.resolve(process.cwd(), rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    try {
      await fs.access(full);
      console.log('skip', rel, '(exists)');
    } catch {
      await fs.writeFile(full, content, 'utf8');
      console.log('create', rel);
    }
  }
  console.log('\n✓ Scaffold complete. Edit aac.yaml and run `aac generate`.\n');
}
