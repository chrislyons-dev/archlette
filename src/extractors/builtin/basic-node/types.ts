/**
 * Internal types for basic-node extractor
 * These are intermediate representations before mapping to ArchletteIR
 */

export interface ExtractorInputs {
  include?: string[];
  exclude?: string[];
  tsConfigPath?: string;
}

export interface FileExtraction {
  filePath: string;
  language: 'typescript' | 'javascript';
  component?: ComponentInfo;
  actors: ActorInfo[];
  relationships: RelationshipInfo[];
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  imports: ExtractedImport[];
  parseError?: string;
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
  description?: string;
}

export interface RelationshipInfo {
  source: string; // Source component/actor ID
  target: string; // Target component/actor name
  description?: string;
}

export interface ExtractedClass {
  name: string;
  isExported: boolean;
  isAbstract: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  extends?: string;
  implements?: string[];
  methods: ExtractedMethod[];
  properties: ExtractedProperty[];
}

export interface ExtractedMethod {
  name: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isAsync: boolean;
  isAbstract: boolean;
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
  location: SourceLocation;
  documentation?: DocInfo;
  type?: string;
}

export interface ExtractedFunction {
  name: string;
  isExported: boolean;
  isAsync: boolean;
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
  isTypeOnly: boolean;
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
