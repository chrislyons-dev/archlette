workspace "Application" "Main application container" {

    model {
        # External actors
        user = person "User" "End user who runs archlette commands"
        filesystem = softwareSystem "FileSystem" "File system for reading and writing files" "External"
        github_structurizr_repo = softwareSystem "Github Structurizr Repo" "The github repo hosting the Structurizr CLI releases. https://github.com/structurizr/cli/releases/download/v${TOOL_VERSIONS.structurizr}/structurizr-cli.zip" "External"
        github_plantuml_repo = softwareSystem "Github PlantUML Repo" "The github repo hosting the PlantUML CLI releases. https://github.com/plantuml/plantuml/releases/download/v${TOOL_VERSIONS.plantuml}/plantuml-${TOOL_VERSIONS.plantuml}.jar" "External"
        local_systems_unzip_utility = softwareSystem "Local System's unzip utility" "The zip extraction utility on the local system (unzip on Unix, Expand-Archive on Windows)." "External"
        file_system = softwareSystem "File System" "The local file system for caching downloaded tools." "External"
        # Application System
        Application = softwareSystem "Application" {
            description "Main application container"
            # Containers




            default_container = container "Application" {
                description "Main application container"
                technology "Application"
                tags "Auto-generated"

                # Components
                default_container__cli = component "CLI" {
                    description "Archlette CLI - Architecture-as-Code toolkit"
                    technology "module"
                }
                default_container__extractors = component "extractors" {
                    description "ArchletteIR aggregation utilities | Extraction stage of the AAC pipeline"
                    technology "module"
                }
                default_container__validators = component "validators" {
                    description "Validation stage of the AAC pipeline | Base IR validator for Archlette pipeline"
                    technology "module"
                }
                default_container__generators = component "generators" {
                    description "Generation stage of the AAC pipeline | Structurizr DSL Generator (Template-based)"
                    technology "module"
                }
                default_container__renderers = component "renderers" {
                    description "Render stage of the AAC pipeline | PlantUML image renderer | Structurizr DSL export renderer"
                    technology "module"
                }
                default_container__docs = component "docs" {
                    description "Documentation stage of the AAC pipeline | Markdown documentation generator"
                    technology "module"
                }
                default_container__core = component "core" {
                    description "Dynamic ESM module loader | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types"
                    technology "module"
                }
                default_container__basicnode = component "basic_node" {
                    description "TypeScript/JavaScript code extractor"
                    technology "module"
                }
                default_container__basic = component "basic" {
                    description "Basic Python Extractor for Archlette\nExtracts architecture information from Python source code"
                    technology "module"
                }
                default_container__basicwrangler = component "basic_wrangler" {
                    description "Cloudflare Wrangler deployment extractor"
                    technology "module"
                }
                default_container__basicpython = component "basic_python" {
                    technology "module"
                }

                # Code elements (classes, functions)
                default_container__cli__usageAndExit = component "cli__usageandexit" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__parseArgs = component "cli__parseargs" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__stageListFromArg = component "cli__stagelistfromarg" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__loadYamlIfExists = component "cli__loadyamlifexists" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__run = component "cli__run" {
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__aggregateIRs = component "extractors__aggregateirs" {
                    description "Aggregate multiple ArchletteIR objects into a single unified IR"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicateById = component "extractors__deduplicatebyid" {
                    description "Deduplicate array of entities by their ID field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicateByName = component "extractors__deduplicatebyname" {
                    description "Deduplicate array of entities by their name field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicateRelationships = component "extractors__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__run = component "extractors__run" {
                    description "Execute the extraction stage"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__run = component "validators__run" {
                    description "Execute the validation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__run = component "generators__run" {
                    description "Execute the generation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__run = component "renderers__run" {
                    description "Execute the rendering stage"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__run = component "docs__run" {
                    description "Execute the documentation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__core__nameToId = component "core__nametoid" {
                    description "Convert a name to a normalized ID\nUsed for consistent ID generation across extractors and mappers"
                    technology "function"
                    tags "Code"
                }
                default_container__core__isTTY = component "core__istty" {
                    description "Determine if we're in a TTY environment (for pretty printing)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getDefaultLogLevel = component "core__getdefaultloglevel" {
                    description "Get default log level from environment or fallback to 'info'"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createPinoLogger = component "core__createpinologger" {
                    description "Create a Pino logger instance with optional pretty printing"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createLogger = component "core__createlogger" {
                    description "Create a logger instance"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadModuleFromPath = component "core__loadmodulefrompath" {
                    description "Dynamically load an ESM module from a path or module specifier"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getCliDir = component "core__getclidir" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__expandTilde = component "core__expandtilde" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveArchlettePath = component "core__resolvearchlettepath" {
                    description "Core path resolver honoring Archlette rules (no file existence checks).\n- \"~\"  -> user home\n- \"/\"  -> absolute\n- else -> relative to CLI dir"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveModuleEntry = component "core__resolvemoduleentry" {
                    description "Resolve a module entry by probing:\n1) Exact path\n2) With extensions: .ts then .js\n3) If directory: index.ts then index.js"
                    technology "function"
                    tags "Code"
                }
                default_container__core__toFileUrl = component "core__tofileurl" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__writeFile = component "core__writefile" {
                    description "Write content to a file, creating parent directories if needed."
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadExtractorModule = component "core__loadextractormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadValidatorModule = component "core__loadvalidatormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadGeneratorModule = component "core__loadgeneratormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadRendererModule = component "core__loadrenderermodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadDocModule = component "core__loaddocmodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__getCacheDir = component "core__getcachedir" {
                    description "Get the Archlette cache directory"
                    technology "function"
                    tags "Code"
                }
                default_container__core__ensureCacheDir = component "core__ensurecachedir" {
                    description "Ensure cache directory exists"
                    technology "function"
                    tags "Code"
                }
                default_container__core__commandExistsInPath = component "core__commandexistsinpath" {
                    description "Check if a command exists in PATH"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadFile = component "core__downloadfile" {
                    description "Download a file from URL to destination"
                    technology "function"
                    tags "Code"
                }
                default_container__core__extractZip = component "core__extractzip" {
                    description "Extract a ZIP file (simple extraction for Structurizr CLI)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__makeExecutable = component "core__makeexecutable" {
                    description "Make file executable (Unix only)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadStructurizr = component "core__downloadstructurizr" {
                    description "Download and install Structurizr CLI to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadPlantUML = component "core__downloadplantuml" {
                    description "Download and install PlantUML to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findStructurizrCLI = component "core__findstructurizrcli" {
                    description "Find or download Structurizr CLI"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findPlantUML = component "core__findplantuml" {
                    description "Find or download PlantUML JAR"
                    technology "function"
                    tags "Code"
                }
                default_container__core__checkJava = component "core__checkjava" {
                    description "Verify Java is available"
                    technology "function"
                    tags "Code"
                }
                default_container__core__requireJava = component "core__requirejava" {
                    description "Validate Java is installed (throw if not)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveConfig = component "core__resolveconfig" {
                    description "For each stage, resolve includes/excludes for each node:\n  - If node omits includes/excludes, inherit from defaults."
                    technology "function"
                    tags "Code"
                }
                default_container__docs__markdownDocs = component "docs__markdowndocs" {
                    description "Generate markdown documentation"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__findDiagramsForView = component "docs__finddiagramsforview" {
                    description "Find diagram files for a specific view type"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__findDiagramsForComponent = component "docs__finddiagramsforcomponent" {
                    description "Find component diagrams for a specific component"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__findClassDiagramsForComponent = component "docs__findclassdiagramsforcomponent" {
                    description "Find class diagrams for a specific component"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__sanitizeFileName = component "docs__sanitizefilename" {
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__basicNodeExtractor = component "basic_node__basicnodeextractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__createEmptyIR = component "basic__createemptyir" {
                    description "Create empty IR when no files found"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__basicPython = component "basic__basicpython" {
                    description "Basic Python extractor\nAnalyzes Python source code and extracts architectural components"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__basicWranglerExtractor = component "basic_wrangler__basicwranglerextractor" {
                    description "Extract deployment topology from Cloudflare Wrangler configuration files"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__structurizrGenerator = component "generators__structurizrgenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__prepareContainerData = component "generators__preparecontainerdata" {
                    description "Prepare container data with components, code, and relationships for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__prepareComponentView = component "generators__preparecomponentview" {
                    description "Prepare component view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__prepareClassView = component "generators__prepareclassview" {
                    description "Prepare class view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateAllActorRelationships = component "generators__generateallactorrelationships" {
                    description "Generate all actor-related relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateUniqueCodeName = component "generators__generateuniquecodename" {
                    description "Generate a unique name for a code item to avoid naming collisions"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__buildTechnologyString = component "generators__buildtechnologystring" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__sanitizeId = component "generators__sanitizeid" {
                    description "Sanitize ID for DSL (remove special characters, convert to valid identifier)"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__escapeString = component "generators__escapestring" {
                    description "Escape special characters in strings for DSL"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__plantumlRender = component "renderers__plantumlrender" {
                    description "Render PlantUML files to PNG images"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__structurizrExport = component "renderers__structurizrexport" {
                    description "Export Structurizr DSL to PlantUML and Mermaid formats"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__baseValidator = component "validators__basevalidator" {
                    description "Validates the IR against the Zod schema. Throws if invalid."
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractClasses = component "basic_node__extractclasses" {
                    description "Extract all class declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractClass = component "basic_node__extractclass" {
                    description "Extract information from a single class declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractMethod = component "basic_node__extractmethod" {
                    description "Extract method information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractProperty = component "basic_node__extractproperty" {
                    description "Extract property information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractMethodParameter = component "basic_node__extractmethodparameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapVisibility = component "basic_node__mapvisibility" {
                    description "Map ts-morph Scope to our visibility string"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__getFileJsDocs = component "basic_node__getfilejsdocs" {
                    description "Get JSDoc comments from a source file\nChecks both the first statement and module-level JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFileComponent = component "basic_node__extractfilecomponent" {
                    description "Extract component information from file-level JSDoc\nChecks the first JSDoc comment in the file for"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFileActors = component "basic_node__extractfileactors" {
                    description "Extract actors from file-level JSDoc\nLooks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFileRelationships = component "basic_node__extractfilerelationships" {
                    description "Extract relationships from file-level JSDoc\nLooks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractComponentFromJsDoc = component "basic_node__extractcomponentfromjsdoc" {
                    description "Extract component info from a JSDoc node"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractActorsFromJsDoc = component "basic_node__extractactorsfromjsdoc" {
                    description "Extract actors from a JSDoc node\nParses"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__parseActorTag = component "basic_node__parseactortag" {
                    description "Parse an"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractRelationshipsFromJsDoc = component "basic_node__extractrelationshipsfromjsdoc" {
                    description "Extract relationships from a JSDoc node\nParses"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__parseUsesTag = component "basic_node__parseusestag" {
                    description "Parse a"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractComponentName = component "basic_node__extractcomponentname" {
                    description "Extract component name from a JSDoc tag\nHandles formats like:\n-"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractDocumentation = component "basic_node__extractdocumentation" {
                    description "Extract documentation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractDeprecation = component "basic_node__extractdeprecation" {
                    description "Extract deprecation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractParameterDescriptions = component "basic_node__extractparameterdescriptions" {
                    description "Extract parameter descriptions from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractReturnDescription = component "basic_node__extractreturndescription" {
                    description "Extract return description from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractParameterName = component "basic_node__extractparametername" {
                    description "Extract parameter name from"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__findSourceFiles = component "basic_node__findsourcefiles" {
                    description "Find source files matching include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__findPackageJsonFiles = component "basic_node__findpackagejsonfiles" {
                    description "Find package.json files within the search paths"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__readPackageInfo = component "basic_node__readpackageinfo" {
                    description "Read and parse package.json file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__findNearestPackage = component "basic_node__findnearestpackage" {
                    description "Find the nearest parent package.json for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__parseFiles = component "basic_node__parsefiles" {
                    description "Parse and extract information from source files"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFunctions = component "basic_node__extractfunctions" {
                    description "Extract all function declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFunction = component "basic_node__extractfunction" {
                    description "Extract information from a single function declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractFunctionParameter = component "basic_node__extractfunctionparameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractArrowFunctions = component "basic_node__extractarrowfunctions" {
                    description "Extract arrow functions assigned to const/let/var\nExamples:\n  const handleClick = () => {}\n  export const createUser = async (data) => {}"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractImports = component "basic_node__extractimports" {
                    description "Extract all import declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapToIR = component "basic_node__maptoir" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__deduplicateRelationships = component "basic_node__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination\nFirst occurrence wins - preserves description from first relationship\nThis allows multiple relationships between the same elements with different stereotypes"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapFunction = component "basic_node__mapfunction" {
                    description "Map a function to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapClass = component "basic_node__mapclass" {
                    description "Map a class to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapMethod = component "basic_node__mapmethod" {
                    description "Map a class method to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__mapImportRelationships = component "basic_node__mapimportrelationships" {
                    description "Map imports to relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__generateId = component "basic_node__generateid" {
                    description "Generate a unique ID for a code element\nFormat: filePath:symbolName"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__getDefaultSystem = component "basic_node__getdefaultsystem" {
                    description "Get default system info from package.json if available"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractTypeAliases = component "basic_node__extracttypealiases" {
                    description "Extract type aliases from a source file\nExamples:\n  type UserRole = 'admin' | 'user' | 'guest'\n  export type ApiResponse<T> = { data: T; status: number }"
                    technology "function"
                    tags "Code"
                }
                default_container__basicnode__extractInterfaces = component "basic_node__extractinterfaces" {
                    description "Extract interfaces from a source file\nExamples:\n  interface User { id: string; name: string }\n  export interface ApiClient { get<T>(url: string): Promise<T> }"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__parseFiles = component "basic_python__parsefiles" {
                    description "Parse Python files using Python AST parser script"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__runPythonParser = component "basic_python__runpythonparser" {
                    description "Run Python parser script and return JSON output"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapToFileExtraction = component "basic_python__maptofileextraction" {
                    description "Map Python parser output to FileExtraction format"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapClass = component "basic_python__mapclass" {
                    description "Map Python class to ExtractedClass"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapMethod = component "basic_python__mapmethod" {
                    description "Map Python method to ExtractedMethod"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapProperty = component "basic_python__mapproperty" {
                    description "Map Python property to ExtractedProperty"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapFunction = component "basic_python__mapfunction" {
                    description "Map Python function to ExtractedFunction"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapType = component "basic_python__maptype" {
                    description "Map Python type definition to ExtractedType"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__mapParameter = component "basic_python__mapparameter" {
                    description "Map Python parameter to ParameterInfo"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__parseDocstring = component "basic_python__parsedocstring" {
                    description "Parse Python docstring into DocInfo\nEnhanced in Phase 2 to use parsed Google/NumPy/Sphinx docstrings"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__extractDeprecation = component "basic_python__extractdeprecation" {
                    description "Extract deprecation info from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__extractReturnDescription = component "basic_python__extractreturndescription" {
                    description "Extract return description from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basicpython__getVisibility = component "basic_python__getvisibility" {
                    description "Determine visibility from Python name convention\n- __name: private\n- _name: protected\n- name: public"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapToIR = component "basic__maptoir" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapComponentToIR = component "basic__mapcomponenttoir" {
                    description "Map ComponentInfo to Component"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapActorToIR = component "basic__mapactortoir" {
                    description "Map ActorInfo to Actor"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapRelationshipsToIR = component "basic__maprelationshipstoir" {
                    description "Map relationships to Relationship[]\nCreates bidirectional actor relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__deduplicateRelationships = component "basic__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapClassToCodeItem = component "basic__mapclasstocodeitem" {
                    description "Map ExtractedClass to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapMethodToCodeItem = component "basic__mapmethodtocodeitem" {
                    description "Map ExtractedMethod to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapFunctionToCodeItem = component "basic__mapfunctiontocodeitem" {
                    description "Map ExtractedFunction to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapTypeToCodeItem = component "basic__maptypetocodeitem" {
                    description "Map ExtractedType to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__findWranglerFiles = component "basic_wrangler__findwranglerfiles" {
                    description "Find wrangler.toml files based on include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__mapToIR = component "basic_wrangler__maptoir" {
                    description "Map wrangler configurations to ArchletteIR\n\nThis creates:\n- Containers: One per wrangler.toml file\n- Deployments: One per environment (production, dev, preview, etc.)\n- Container Instances: One per container per environment\n- Container Relationships: Logical dependencies from service bindings\n- Deployment Relationships: Physical instance-to-instance connections"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__extractContainers = component "basic_wrangler__extractcontainers" {
                    description "Extract containers from wrangler configurations\n\nCreates one container per wrangler.toml file.\nEach container represents a Cloudflare Worker."
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__buildContainerDescription = component "basic_wrangler__buildcontainerdescription" {
                    description "Build a descriptive summary for a container"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__extractDeploymentsAndInstances = component "basic_wrangler__extractdeploymentsandinstances" {
                    description "Extract deployments and container instances\n\nCreates:\n- One deployment per environment\n- Container instances for each container in each environment"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__extractContainerRelationships = component "basic_wrangler__extractcontainerrelationships" {
                    description "Extract container relationships from service bindings\n\nCreates logical dependencies between containers based on service bindings.\nDeduplicates relationships across all environments."
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__extractDeploymentRelationships = component "basic_wrangler__extractdeploymentrelationships" {
                    description "Extract deployment relationships from container instances\n\nCreates physical instance-to-instance relationships based on service bindings.\nEach relationship represents an actual runtime dependency in a specific environment."
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__parseWranglerFile = component "basic_wrangler__parsewranglerfile" {
                    description "Parse a wrangler.toml file"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__normalizeServiceBindings = component "basic_wrangler__normalizeservicebindings" {
                    description "Normalize service bindings from various formats\n\nWrangler supports multiple binding formats:\n- [[services]] array (TOML array of tables)\n- services = [{ binding = \"...\", service = \"...\" }]"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__getEnvironments = component "basic_wrangler__getenvironments" {
                    description "Get all environments from a wrangler config\n\nReturns a list of environment names, including:\n- \"production\" (from root-level config if it has deployable content)\n- All keys from env.* sections"
                    technology "function"
                    tags "Code"
                }
                default_container__basicwrangler__getEnvironmentConfig = component "basic_wrangler__getenvironmentconfig" {
                    description "Get configuration for a specific environment\n\nMerges root-level config with environment-specific overrides.\nEnvironment config takes precedence."
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                default_container__cli -> default_container__extractors "Analyzes source code to extract architecture components"
                default_container__cli -> default_container__validators "Validates and enriches intermediate representation"
                default_container__cli -> default_container__generators "Transforms IR into DSL formats"
                default_container__cli -> default_container__renderers "Converts DSL to visual diagrams"
                default_container__cli -> default_container__core "Provides shared utilities, types, and module loading"
                default_container__extractors -> default_container__core "Provides IR types, validation schemas, and module loading"
                default_container__extractors -> default_container__basicnode "composed of node extractor"
                default_container__extractors -> default_container__basicpython "composed of python extractor"
                default_container__extractors -> default_container__basicwrangler "composed of cloudflare wrangler extractor"
                default_container__validators -> default_container__core "Provides IR types, validation schemas, and module loading"
                default_container__generators -> default_container__core "Provides IR types, path resolution, and module loading"
                default_container__renderers -> default_container__core "Provides types, module loading, and tool management"
                default_container__docs -> default_container__core "Provides types, module loading, and path resolution"
            }

        }
        # Actor interactions
        user -> default_container__cli "Interacts with CLI"
        default_container__core -> filesystem "Uses FileSystem for external system integration"
        default_container__core -> github_structurizr_repo "Uses Github Structurizr Repo for external system integration"
        default_container__core -> github_plantuml_repo "Uses Github PlantUML Repo for external system integration"
        default_container__core -> local_systems_unzip_utility "Uses Local System's unzip utility for external system integration"
        default_container__core -> file_system "Uses File System for external system integration"
    }

    views {

        systemContext Application "SystemContext" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_systems_unzip_utility
            include file_system
            include Application
            autoLayout
        }

        container Application "Containers" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_systems_unzip_utility
            include file_system
            include default_container
            autoLayout
        }


        component default_container "Components_Application" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_systems_unzip_utility
            include file_system
            include default_container__cli
            include default_container__extractors
            include default_container__validators
            include default_container__generators
            include default_container__renderers
            include default_container__docs
            include default_container__core
            include default_container__basicnode
            include default_container__basic
            include default_container__basicwrangler
            include default_container__basicpython
            exclude "element.tag==Code"
            autoLayout
        }


        component default_container "Classes_default_container__cli" {
            include default_container__cli__usageAndExit
            include default_container__cli__parseArgs
            include default_container__cli__stageListFromArg
            include default_container__cli__loadYamlIfExists
            include default_container__cli__run
            autoLayout
        }


        component default_container "Classes_default_container__extractors" {
            include default_container__extractors__aggregateIRs
            include default_container__extractors__deduplicateById
            include default_container__extractors__deduplicateByName
            include default_container__extractors__deduplicateRelationships
            include default_container__extractors__run
            autoLayout
        }


        component default_container "Classes_default_container__validators" {
            include default_container__validators__run
            include default_container__validators__baseValidator
            autoLayout
        }


        component default_container "Classes_default_container__generators" {
            include default_container__generators__run
            include default_container__generators__structurizrGenerator
            include default_container__generators__prepareContainerData
            include default_container__generators__prepareComponentView
            include default_container__generators__prepareClassView
            include default_container__generators__generateAllActorRelationships
            include default_container__generators__generateUniqueCodeName
            include default_container__generators__buildTechnologyString
            include default_container__generators__sanitizeId
            include default_container__generators__escapeString
            autoLayout
        }


        component default_container "Classes_default_container__renderers" {
            include default_container__renderers__run
            include default_container__renderers__plantumlRender
            include default_container__renderers__structurizrExport
            autoLayout
        }


        component default_container "Classes_default_container__docs" {
            include default_container__docs__run
            include default_container__docs__markdownDocs
            include default_container__docs__findDiagramsForView
            include default_container__docs__findDiagramsForComponent
            include default_container__docs__findClassDiagramsForComponent
            include default_container__docs__sanitizeFileName
            autoLayout
        }


        component default_container "Classes_default_container__core" {
            include default_container__core__nameToId
            include default_container__core__isTTY
            include default_container__core__getDefaultLogLevel
            include default_container__core__createPinoLogger
            include default_container__core__createLogger
            include default_container__core__loadModuleFromPath
            include default_container__core__getCliDir
            include default_container__core__expandTilde
            include default_container__core__resolveArchlettePath
            include default_container__core__resolveModuleEntry
            include default_container__core__toFileUrl
            include default_container__core__writeFile
            include default_container__core__loadExtractorModule
            include default_container__core__loadValidatorModule
            include default_container__core__loadGeneratorModule
            include default_container__core__loadRendererModule
            include default_container__core__loadDocModule
            include default_container__core__getCacheDir
            include default_container__core__ensureCacheDir
            include default_container__core__commandExistsInPath
            include default_container__core__downloadFile
            include default_container__core__extractZip
            include default_container__core__makeExecutable
            include default_container__core__downloadStructurizr
            include default_container__core__downloadPlantUML
            include default_container__core__findStructurizrCLI
            include default_container__core__findPlantUML
            include default_container__core__checkJava
            include default_container__core__requireJava
            include default_container__core__resolveConfig
            autoLayout
        }


        component default_container "Classes_default_container__basicnode" {
            include default_container__basicnode__basicNodeExtractor
            include default_container__basicnode__extractClasses
            include default_container__basicnode__extractClass
            include default_container__basicnode__extractMethod
            include default_container__basicnode__extractProperty
            include default_container__basicnode__extractMethodParameter
            include default_container__basicnode__mapVisibility
            include default_container__basicnode__getFileJsDocs
            include default_container__basicnode__extractFileComponent
            include default_container__basicnode__extractFileActors
            include default_container__basicnode__extractFileRelationships
            include default_container__basicnode__extractComponentFromJsDoc
            include default_container__basicnode__extractActorsFromJsDoc
            include default_container__basicnode__parseActorTag
            include default_container__basicnode__extractRelationshipsFromJsDoc
            include default_container__basicnode__parseUsesTag
            include default_container__basicnode__extractComponentName
            include default_container__basicnode__extractDocumentation
            include default_container__basicnode__extractDeprecation
            include default_container__basicnode__extractParameterDescriptions
            include default_container__basicnode__extractReturnDescription
            include default_container__basicnode__extractParameterName
            include default_container__basicnode__findSourceFiles
            include default_container__basicnode__findPackageJsonFiles
            include default_container__basicnode__readPackageInfo
            include default_container__basicnode__findNearestPackage
            include default_container__basicnode__parseFiles
            include default_container__basicnode__extractFunctions
            include default_container__basicnode__extractFunction
            include default_container__basicnode__extractFunctionParameter
            include default_container__basicnode__extractArrowFunctions
            include default_container__basicnode__extractImports
            include default_container__basicnode__mapToIR
            include default_container__basicnode__deduplicateRelationships
            include default_container__basicnode__mapFunction
            include default_container__basicnode__mapClass
            include default_container__basicnode__mapMethod
            include default_container__basicnode__mapImportRelationships
            include default_container__basicnode__generateId
            include default_container__basicnode__getDefaultSystem
            include default_container__basicnode__extractTypeAliases
            include default_container__basicnode__extractInterfaces
            autoLayout
        }


        component default_container "Classes_default_container__basic" {
            include default_container__basic__createEmptyIR
            include default_container__basic__basicPython
            include default_container__basic__mapToIR
            include default_container__basic__mapComponentToIR
            include default_container__basic__mapActorToIR
            include default_container__basic__mapRelationshipsToIR
            include default_container__basic__deduplicateRelationships
            include default_container__basic__mapClassToCodeItem
            include default_container__basic__mapMethodToCodeItem
            include default_container__basic__mapFunctionToCodeItem
            include default_container__basic__mapTypeToCodeItem
            autoLayout
        }


        component default_container "Classes_default_container__basicwrangler" {
            include default_container__basicwrangler__basicWranglerExtractor
            include default_container__basicwrangler__findWranglerFiles
            include default_container__basicwrangler__mapToIR
            include default_container__basicwrangler__extractContainers
            include default_container__basicwrangler__buildContainerDescription
            include default_container__basicwrangler__extractDeploymentsAndInstances
            include default_container__basicwrangler__extractContainerRelationships
            include default_container__basicwrangler__extractDeploymentRelationships
            include default_container__basicwrangler__parseWranglerFile
            include default_container__basicwrangler__normalizeServiceBindings
            include default_container__basicwrangler__getEnvironments
            include default_container__basicwrangler__getEnvironmentConfig
            autoLayout
        }


        component default_container "Classes_default_container__basicpython" {
            include default_container__basicpython__parseFiles
            include default_container__basicpython__runPythonParser
            include default_container__basicpython__mapToFileExtraction
            include default_container__basicpython__mapClass
            include default_container__basicpython__mapMethod
            include default_container__basicpython__mapProperty
            include default_container__basicpython__mapFunction
            include default_container__basicpython__mapType
            include default_container__basicpython__mapParameter
            include default_container__basicpython__parseDocstring
            include default_container__basicpython__extractDeprecation
            include default_container__basicpython__extractReturnDescription
            include default_container__basicpython__getVisibility
            autoLayout
        }

    }

}
