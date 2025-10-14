/**
 * Map IR entities to a simple C4-ish view.
 * - Project `api` entities as `container` with tech "HTTP API (OpenAPI)"
 */
export function mapToC4(ir) {
  const people = [];
  const systems = [];
  const containers = [];
  const components = [];
  const seen = new Set();

  const pushUnique = (arr, obj, key = 'id') => {
    if (seen.has(obj[key])) return;
    seen.add(obj[key]);
    arr.push(obj);
  };

  for (const e of ir.entities || []) {
    if (e.kind === 'person') pushUnique(people, e);
    else if (e.kind === 'system') pushUnique(systems, e);
    else if (e.kind === 'container') pushUnique(containers, e);
    else if (e.kind === 'component') pushUnique(components, e);
    else if (e.kind === 'api') {
      const tech = e.props?.tech || 'HTTP API (OpenAPI)';
      const cont = {
        ...e,
        kind: 'container',
        props: { ...(e.props || {}), tech },
        tags: Array.from(new Set([...(e.tags || []), 'api'])),
        id: e.id.replace(/^api:/, 'container:api:'),
      };
      pushUnique(containers, cont);
    }
  }

  return { people, systems, containers, components, relations: ir.relations || [] };
}
