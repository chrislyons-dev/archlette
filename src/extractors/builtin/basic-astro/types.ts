/**
 * @module basic-astro
 * Internal types for basic-astro extractor
 * Intermediate representations before mapping to ArchletteIR
 */

// Import code-related types from basic-node (reused for frontmatter analysis)
import type {
  ExtractedClass,
  ExtractedFunction,
  ExtractedType,
  ExtractedInterface,
  ExtractedMethod,
  ParameterInfo,
  DocInfo,
  DeprecationInfo,
  SourceLocation,
} from '../basic-node/types.js';

// Re-export for external use
export type {
  ExtractedClass,
  ExtractedFunction,
  ExtractedType,
  ExtractedInterface,
  ExtractedMethod,
  ParameterInfo,
  DocInfo,
  DeprecationInfo,
  SourceLocation,
};

/**
 * Configuration inputs for the Astro file discovery
 * Specifies glob patterns to include and exclude files during the scan phase
 */
export interface ExtractorInputs {
  /** Glob patterns to include (defaults to src/**\/*.astro and **\/*.astro) */
  include?: string[];
  /** Glob patterns to exclude (defaults to node_modules, dist, build, .astro) */
  exclude?: string[];
}

/**
 * Metadata extracted from a package.json file
 * Used to identify containers and assign files to packages
 */
export interface PackageInfo {
  /** Absolute path to the package.json file */
  path: string;
  /** Directory containing the package.json */
  dir: string;
  /** Package name from package.json */
  name: string;
  /** Package version (optional) */
  version?: string;
  /** Package description (optional) */
  description?: string;
}

/**
 * Information about an Astro component identified from JSDoc or file path
 * Represents the logical component grouping for code organization
 */
export interface ComponentInfo {
  /** Sanitized component identifier (lowercase, no special chars) */
  id: string;
  /** Human-readable component name */
  name: string;
  /** Optional description from JSDoc comment */
  description?: string;
  /** Internal marker: true if inferred from directory path, false if explicit JSDoc tag */
  _inferred?: boolean;
}

/**
 * External actor (Person or System) identified via JSDoc @actor tags
 * Represents entities outside the architecture that interact with components
 */
export interface ActorInfo {
  /** Sanitized actor identifier */
  id: string;
  /** Human-readable actor name */
  name: string;
  /** Actor type: Person (user/role) or System (external service) */
  type: 'Person' | 'System';
  /** Relationship direction: in (receives), out (sends), or both */
  direction?: 'in' | 'out' | 'both';
  /** Optional description of the actor's role */
  description?: string;
}

/**
 * A dependency relationship between components identified via JSDoc @uses tags
 * Represents that one component uses/depends on another
 */
export interface RelationshipInfo {
  /** Source component ID (populated by mapper during IR generation) */
  source: string;
  /** Target component or actor name (will be sanitized to ID during mapping) */
  target: string;
  /** Optional description of the relationship */
  description?: string;
}

/**
 * Complete extraction result for a single Astro file
 * Contains all architectural information discovered from one .astro file
 * Serves as the intermediate format before IR mapping
 */
export interface FileExtraction {
  /** Absolute path to the Astro file */
  filePath: string;
  /** Language identifier: always 'astro' */
  language: 'astro';
  /** Main component identified in this file (if any) */
  component?: ComponentInfo;
  /** External actors referenced in this file */
  actors: ActorInfo[];
  /** Component-to-component or component-to-actor dependencies */
  relationships: RelationshipInfo[];
  /** Imported components used in the template */
  components: ExtractedComponent[];
  /** Functions defined in frontmatter */
  functions: ExtractedFunction[];
  /** Classes defined in frontmatter */
  classes: ExtractedClass[];
  /** Type aliases defined in frontmatter */
  types: ExtractedType[];
  /** TypeScript interfaces defined in frontmatter */
  interfaces: ExtractedInterface[];
  /** Import statements from frontmatter */
  imports: ExtractedImport[];
  /** Parse error if compilation failed (undefined if successful) */
  parseError?: string;
  /** Package metadata if file is within a package.json directory */
  packageInfo?: PackageInfo;
}

/**
 * An Astro component used or imported in the template
 * Tracks the component's public API and metadata
 */
export interface ExtractedComponent {
  /** Component name */
  name: string;
  /** Whether this component is exported from its module */
  isExported: boolean;
  /** Component props interface definition and properties */
  props?: ExtractedProps;
  /** Named and default slots the component provides */
  slots: ExtractedSlot[];
  /** Client directive if present (e.g., 'client:load', 'client:idle') */
  clientDirective?: string;
  /** Source location in the file */
  location: SourceLocation;
  /** JSDoc documentation */
  documentation?: DocInfo;
}

/**
 * Component props interface with typed properties
 * Defines the public API of an Astro component
 */
export interface ExtractedProps {
  /** Full TypeScript interface definition as string */
  interface?: string;
  /** Parsed property list from the interface */
  properties: ExtractedProperty[];
}

/**
 * A single property in a component's Props interface
 * Captures the property's type information and documentation
 */
export interface ExtractedProperty {
  /** Property name */
  name: string;
  /** TypeScript type annotation (if available) */
  type?: string;
  /** Whether the property is optional (? modifier) */
  optional: boolean;
  /** Default value if specified */
  defaultValue?: string;
  /** Property description from JSDoc */
  description?: string;
}

/**
 * A slot provided by an Astro component
 * Slots allow content projection from parent components
 */
export interface ExtractedSlot {
  /** Slot name: 'default' for unnamed slot, or specific name for named slots */
  name: string;
  /** Source location of the slot definition */
  location: SourceLocation;
}

/**
 * An import statement from the Astro component frontmatter
 * Tracks what is imported and how
 */
export interface ExtractedImport {
  /** Module being imported from */
  source: string;
  /** Names being imported (specific exports) */
  importedNames: string[];
  /** Whether this is a default import */
  isDefault: boolean;
  /** Whether this is a namespace import (import * as) */
  isNamespace: boolean;
}

/**
 * Output structure from Astro compiler
 * Represents the parsed AST and metadata from one or more Astro files
 * Currently unused but reserved for future Astro compiler API integration
 */
export interface AstroParserOutput {
  /** Array of parsed files with their extracted metadata */
  files: Array<{
    /** Absolute path to the Astro file */
    filePath: string;
    /** TypeScript/JavaScript code from frontmatter */
    frontmatter?: string;
    /** HTML template markup */
    template?: string;
    /** Main component metadata */
    component?: {
      name: string;
      description?: string;
    };
    /** External actors referenced */
    actors: Array<{
      name: string;
      type: 'Person' | 'System';
      direction?: 'in' | 'out' | 'both';
      description?: string;
    }>;
    /** Component-to-component dependencies */
    relationships: Array<{
      target: string;
      description?: string;
    }>;
    /** Import statements */
    imports: Array<{
      source: string;
      names: string[];
      isDefault: boolean;
      isNamespace: boolean;
    }>;
    /** Component props interface */
    props?: {
      interface?: string;
      properties: Array<{
        name: string;
        type?: string;
        optional: boolean;
        defaultValue?: string;
      }>;
    };
    /** Named and default slots */
    slots: Array<{
      name: string;
      line: number;
    }>;
    /** Client directive if present */
    clientDirective?: string;
    /** Parse error if compilation failed */
    parseError?: string;
  }>;
}
