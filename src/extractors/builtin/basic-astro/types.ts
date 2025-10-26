/**
 * @module basic-astro
 * Internal types for basic-astro extractor
 * Intermediate representations before mapping to ArchletteIR
 */

export interface ExtractorInputs {
  include?: string[];
  exclude?: string[];
}

export interface PackageInfo {
  path: string;
  dir: string;
  name: string;
  version?: string;
  description?: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ActorInfo {
  id: string;
  name: string;
  type: 'Person' | 'System';
  direction?: 'in' | 'out' | 'both';
  description?: string;
}

export interface RelationshipInfo {
  source: string; // Source component ID (filled by mapper)
  target: string; // Target component/actor name
  description?: string;
}

export interface FileExtraction {
  filePath: string;
  language: 'astro';
  component?: ComponentInfo;
  actors: ActorInfo[];
  relationships: RelationshipInfo[];
  components: ExtractedComponent[];
  functions: ExtractedFunction[];
  classes: ExtractedClass[];
  imports: ExtractedImport[];
  parseError?: string;
  packageInfo?: PackageInfo;
}

export interface ExtractedComponent {
  name: string;
  isExported: boolean;
  props?: ExtractedProps;
  slots: ExtractedSlot[];
  clientDirective?: string; // client:load, client:idle, etc.
  location: SourceLocation;
  documentation?: DocInfo;
}

export interface ExtractedProps {
  interface?: string; // TypeScript interface definition
  properties: ExtractedProperty[];
}

export interface ExtractedProperty {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ExtractedSlot {
  name: string; // 'default' or named slot
  location: SourceLocation;
}

export interface ExtractedClass {
  name: string;
  isExported: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  methods: ExtractedMethod[];
}

export interface ExtractedMethod {
  name: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isAsync: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  parameters: ParameterInfo[];
  returnType?: string;
}

export interface ExtractedFunction {
  name: string;
  isExported: boolean;
  isAsync: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  parameters: ParameterInfo[];
  returnType?: string;
}

export interface ExtractedImport {
  source: string;
  importedNames: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  description?: string;
  optional: boolean;
  defaultValue?: string;
}

export interface DocInfo {
  summary?: string;
  details?: string;
  examples?: string[];
  remarks?: string[];
  seeAlso?: string[];
}

export interface DeprecationInfo {
  reason?: string;
  alternative?: string;
}

export interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
}

/**
 * Output structure from Astro compiler
 */
export interface AstroParserOutput {
  files: Array<{
    filePath: string;
    frontmatter?: string; // TypeScript/JavaScript code
    template?: string; // HTML template
    component?: {
      name: string;
      description?: string;
    };
    actors: Array<{
      name: string;
      type: 'Person' | 'System';
      direction?: 'in' | 'out' | 'both';
      description?: string;
    }>;
    relationships: Array<{
      target: string;
      description?: string;
    }>;
    imports: Array<{
      source: string;
      names: string[];
      isDefault: boolean;
      isNamespace: boolean;
    }>;
    props?: {
      interface?: string;
      properties: Array<{
        name: string;
        type?: string;
        optional: boolean;
        defaultValue?: string;
      }>;
    };
    slots: Array<{
      name: string;
      line: number;
    }>;
    clientDirective?: string;
    parseError?: string;
  }>;
}
