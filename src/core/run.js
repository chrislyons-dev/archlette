import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { resolveOutDir } from './config.js';
import { sh, shShell } from './exec.js';
import { log } from './log.js';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}
async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, 'utf8');
}

async function renderPlantUML(outDir, cfg) {
  if (!cfg.tools?.plantuml?.enabled) return;
  const jar = cfg.tools.plantuml.jar;
  const formats = cfg.tools.plantuml.render || ['-tpng'];
  const pumlFiles = await globby([path.join(outDir, '**/*.puml')]);
  if (!pumlFiles.length) return;
  for (const f of pumlFiles) {
    for (const fmt of formats) {
      log.verbose(`java -jar ${jar} ${fmt} ${f}`);
      await sh('java', ['-jar', jar, fmt, f]);
    }
  }
  log.ok('PlantUML rendered');
}

async function renderMermaid(outDir, cfg) {
  if (!cfg.tools?.mermaid?.enabled) return;
  const mmdc = cfg.tools.mermaid.mmdc || 'mmdc';
  const mmdFiles = await globby([
    path.join(outDir, '**/*.mmd'),
    path.join(outDir, '**/*.mermaid'),
  ]);
  for (const f of mmdFiles) {
    const out = f.replace(/\.(mmd|mermaid)$/i, '.svg');
    log.verbose(`${mmdc} -i ${f} -o ${out}`);
    await sh(mmdc, ['-i', f, '-o', out]);
  }
  log.ok('Mermaid rendered');
}

async function runInframap(cfg, outDir) {
  const gen = (cfg.generators || []).find((g) => g.kind === 'inframap');
  if (!gen) return;
  if (!cfg.tools?.inframap?.enabled) {
    await writeText(
      path.join(outDir, 'infrastructure.dot'),
      'digraph G { /* inframap disabled */ }\n',
    );
    log.warn('Inframap disabled: wrote placeholder DOT');
    return;
  }
  const cmd = cfg.tools.inframap.cmd || 'inframap';
  const workdir = gen.workdir || 'iac';
  const dotOut = path.join(outDir, gen.output || 'infrastructure.dot');
  await ensureDir(path.dirname(dotOut));
  if (gen.args) {
    log.verbose(`${cmd} ${gen.args} > ${dotOut} (cwd=${workdir})`);
    await shShell(`${cmd} ${gen.args} > "${dotOut}"`, { cwd: workdir });
  } else {
    log.verbose(`${cmd} generate . > ${dotOut} (cwd=${workdir})`);
    await shShell(`${cmd} generate . > "${dotOut}"`, { cwd: workdir });
  }
  if (gen.render_png) {
    const pngOut = dotOut.replace(/\.dot$/i, '.png');
    log.verbose(`dot -Tpng ${dotOut} -o ${pngOut}`);
    await sh(cfg.tools.graphviz.dot || 'dot', ['-Tpng', dotOut, '-o', pngOut]);
  }
  log.ok('Inframap graph generated');
}

export async function runGenerate(cfg) {
  const outDir = resolveOutDir(cfg);
  await ensureDir(outDir);
  const gens = cfg.generators;
  if (!gens.length) {
    console.log('No generators configured. Edit aac.yaml -> generators:');
    return;
  }
  for (const g of gens) {
    if (g.kind === 'mermaid-c4') {
      const file = path.join(
        outDir,
        `c4-${(g.levels || ['C1']).join('_').toLowerCase()}.mmd`,
      );
      await writeText(
        file,
        `%% Mermaid C4 placeholder. Replace with discovered model.\nflowchart TD\n  U[User] --> S[System]\n`,
      );
      console.log('✓ mermaid-c4 ->', file);
    } else if (g.kind === 'plantuml-c4') {
      const puml =
        '@startuml\n' +
        '!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml\n' +
        'Person(user, "User")\nSystem(sys, "System")\n' +
        'Rel(user, sys, "uses")\n@enduml\n';
      const file = path.join(outDir, 'c4.puml');
      await writeText(file, puml);
      console.log('✓ plantuml-c4 ->', file);
    } else if (g.kind === 'inframap') {
      console.log('↻ inframap scheduled…');
    } else {
      console.log('⚠ unknown generator kind:', g.kind);
    }
  }

  const idx = path.join(outDir, 'index.md');
  await writeText(
    idx,
    `# Architecture Index\n\n- Mermaid C4\n- PlantUML C4\n- Inframap graph\n- ADRs: see ../adr\n`,
  );
  console.log('✓ index ->', idx);

  await renderPlantUML(outDir, cfg);
  await renderMermaid(outDir, cfg);
  await runInframap(cfg, outDir);
}
