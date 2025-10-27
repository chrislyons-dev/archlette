/**
 * @module basic_node
 * Internal types for basic-node extractor
 * These are intermediate representations before mapping to ArchletteIR
 */

export interface ExtractorInputs {
  include?: string[];
  exclude?: string[];
  tsConfigPath?: string;
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
  language: 'typescript' | 'javascript';
  component?: ComponentInfo;
  actors: ActorInfo[];
  relationships: RelationshipInfo[];
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  types: ExtractedType[];
  interfaces: ExtractedInterface[];
  imports: ExtractedImport[];
  parseError?: string;
  packageInfo?: PackageInfo;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
  _inferred?: boolean; // Internal marker: true if inferred from path, false if explicit tag
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

export interface ExtractedType {
  name: string;
  isExported: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  typeParameters?: TypeParameterInfo[];
  definition: string;
}

export interface ExtractedInterface {
  name: string;
  isExported: boolean;
  location: SourceLocation;
  documentation?: DocInfo;
  deprecated?: DeprecationInfo;
  typeParameters?: TypeParameterInfo[];
  extends?: string[];
  properties: InterfaceProperty[];
  methods: InterfaceMethod[];
}

export interface TypeParameterInfo {
  name: string;
  constraint?: string;
  default?: string;
}

export interface InterfaceProperty {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
}

export interface InterfaceMethod {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
}
