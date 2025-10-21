/**
 * Internal types for basic-python extractor
 * These are intermediate representations before mapping to ArchletteIR
 */

export interface ExtractorInputs {
  include?: string[];
  exclude?: string[];
  pythonPath?: string;
}

export interface PackageInfo {
  path: string;
  dir: string;
  name: string;
  version?: string;
  description?: string;
}

export interface FileExtraction {
  filePath: string;
  language: 'python';
  component?: ComponentInfo;
  actors: ActorInfo[];
  relationships: RelationshipInfo[];
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  types: ExtractedType[];
  imports: ExtractedImport[];
  parseError?: string;
  packageInfo?: PackageInfo;
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
  source: string; // Source component/actor ID
  target: string; // Target component/actor name
  description?: string;
}

export interface ExtractedClass {
  name: string;
  isExported: boolean; // Python doesn't have export, but we track if name is public
  baseClasses: string[];
  decorators: string[];
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  methods: ExtractedMethod[];
  properties: ExtractedProperty[];
}

export interface ExtractedMethod {
  name: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isAsync: boolean;
  isAbstract: boolean;
  isClassMethod: boolean;
  decorators: string[];
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  parameters: ParameterInfo[];
  returnType?: string;
  returnDescription?: string;
}

export interface ExtractedProperty {
  name: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
  isProperty: boolean; // True if @property decorator
  location: SourceLocation;
  documentation?: DocInfo;
  type?: string;
  defaultValue?: string;
  hasGetter?: boolean;
  hasSetter?: boolean;
  hasDeleter?: boolean;
}

export interface ExtractedFunction {
  name: string;
  isExported: boolean; // Public at module level
  isAsync: boolean;
  decorators: string[];
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  parameters: ParameterInfo[];
  returnType?: string;
  returnDescription?: string;
}

export interface ExtractedImport {
  source: string;
  importedNames: string[];
  isRelative: boolean;
  level?: number; // For relative imports (. = 1, .. = 2, etc.)
}

export interface ParameterInfo {
  name: string;
  type?: string;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
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

export interface ExtractedType {
  name: string;
  isExported: boolean;
  category: 'TypeAlias' | 'TypedDict' | 'Protocol' | 'Enum' | 'NewType';
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  definition: string;
}

/**
 * JSON structure returned by Python AST parser script
 */
export interface PythonParserOutput {
  files: Array<{
    filePath: string;
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
    classes: Array<{
      name: string;
      baseClasses: string[];
      decorators: string[];
      line: number;
      docstring?: string;
      methods: Array<{
        name: string;
        isStatic: boolean;
        isAsync: boolean;
        isClassMethod: boolean;
        isAbstract: boolean;
        decorators: string[];
        line: number;
        docstring?: string;
        parsedDoc?: {
          summary?: string;
          description?: string;
          args?: Array<{
            name: string;
            type?: string;
            description?: string;
          }>;
          returns?: {
            type?: string;
            description?: string;
          };
          raises?: Array<{
            type: string;
            description?: string;
          }>;
          examples?: string;
        };
        parameters: Array<{
          name: string;
          annotation?: string;
          default?: string;
        }>;
        returnAnnotation?: string;
      }>;
      properties: Array<{
        name: string;
        type?: 'property' | 'class_variable';
        annotation?: string;
        default?: string;
        line: number;
        docstring?: string;
        isReadonly?: boolean;
        hasGetter?: boolean;
        hasSetter?: boolean;
        hasDeleter?: boolean;
      }>;
    }>;
    functions: Array<{
      name: string;
      isAsync: boolean;
      decorators: string[];
      line: number;
      docstring?: string;
      parsedDoc?: {
        summary?: string;
        description?: string;
        args?: Array<{
          name: string;
          type?: string;
          description?: string;
        }>;
        returns?: {
          type?: string;
          description?: string;
        };
        raises?: Array<{
          type: string;
          description?: string;
        }>;
        examples?: string;
      };
      parameters: Array<{
        name: string;
        annotation?: string;
        default?: string;
      }>;
      returnAnnotation?: string;
    }>;
    types: Array<{
      name: string;
      category: 'TypeAlias' | 'TypedDict' | 'Protocol' | 'Enum' | 'NewType';
      line: number;
      definition?: string;
      docstring?: string;
    }>;
    imports: Array<{
      source: string;
      names: string[];
      isRelative: boolean;
      level?: number;
    }>;
    parseError?: string;
  }>;
}
