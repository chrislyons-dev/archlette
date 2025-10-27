workspace "Application" "Main application container" {

    model {
        # External actors
        user = person "User" "End user who runs archlette commands"
        filesystem = softwareSystem "FileSystem" "File system for reading and writing files" "External"
        github_structurizr_repo = softwareSystem "Github Structurizr Repo" "The github repo hosting the Structurizr CLI releases. https://github.com/structurizr/cli/releases/download/v${TOOL_VERSIONS.structurizr}/structurizr-cli.zip" "External"
        github_plantuml_repo = softwareSystem "Github PlantUML Repo" "The github repo hosting the PlantUML CLI releases. https://github.com/plantuml/plantuml/releases/download/v${TOOL_VERSIONS.plantuml}/plantuml-${TOOL_VERSIONS.plantuml}.jar" "External"
        local_system_s_unzip_utility = softwareSystem "Local System's unzip utility" "The zip extraction utility on the local system (unzip on Unix, Expand-Archive on Windows)." "External"
        file_system = softwareSystem "File System" "The local file system for caching downloaded tools." "External"
        # Application System
        Application = softwareSystem "Application" {
            description "Main application container"
            # Containers




            default_container = container "Application" {
                description "Main application container"
                technology "Application"
                tags "Application,Auto-generated"

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
                    description "Dynamic ESM module loader | Component inferred from directory: core | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types"
                    technology "module"
                }
                default_container__basic_astro = component "basic-astro" {
                    description "Astro component extractor"
                    technology "module"
                }
                default_container__basic_node = component "basic_node" {
                    description "TypeScript/JavaScript code extractor"
                    technology "module"
                }
                default_container__basic_python = component "basic-python" {
                    description "Basic Python Extractor for Archlette Extracts architecture information from Python source code"
                    technology "module"
                }
                default_container__basic_wrangler = component "basic_wrangler" {
                    description "Cloudflare Wrangler deployment extractor"
                    technology "module"
                }

                # Code elements (classes, functions)
                default_container__cli__usageandexit = component "CLI.usageAndExit" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__parseargs = component "CLI.parseArgs" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__stagelistfromarg = component "CLI.stageListFromArg" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__run = component "CLI.run" {
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__aggregateirs = component "extractors.aggregateIRs" {
                    description "Aggregate multiple ArchletteIR objects into a single unified IR"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicatebyid = component "extractors.deduplicateById" {
                    description "Deduplicate array of entities by their ID field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicatebyname = component "extractors.deduplicateByName" {
                    description "Deduplicate array of entities by their name field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicaterelationships = component "extractors.deduplicateRelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__run = component "extractors.run" {
                    description "Execute the extraction stage"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__run = component "validators.run" {
                    description "Execute the validation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__run = component "generators.run" {
                    description "Execute the generation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__run = component "renderers.run" {
                    description "Execute the rendering stage"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__run = component "docs.run" {
                    description "Execute the documentation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveconfigfilepath = component "core.resolveConfigFilePath" {
                    description "Resolve config file path from CLI arguments"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveconfigbasedir = component "core.resolveConfigBaseDir" {
                    description "Determine base directory for resolving config-relative paths Logic: - If using default template: CWD (user's project directory) - If user provided config file: config file's directory - Fallback: CWD"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadyamlfile = component "core.loadYamlFile" {
                    description "Load and parse YAML config file"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createdefaultconfig = component "core.createDefaultConfig" {
                    description "Create minimal default configuration when no config file is found"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadconfig = component "core.loadConfig" {
                    description "Load configuration from file path (high-level API) This is the main entry point for config loading. It handles: 1. Config file path resolution (default vs user-provided) 2. Base directory determination 3. YAML parsing 4. Config validation and resolution 5. Fallback to default config"
                    technology "function"
                    tags "Code"
                }
                default_container__core__nametoid = component "core.nameToId" {
                    description "Convert a name to a normalized ID Used for consistent ID generation across extractors and mappers"
                    technology "function"
                    tags "Code"
                }
                default_container__core__sanitizeid = component "core.sanitizeId" {
                    description "Sanitize ID for DSL and code identifiers (preserves underscores) Used for Python code identifiers where underscores are significant"
                    technology "function"
                    tags "Code"
                }
                default_container__core__istty = component "core.isTTY" {
                    description "Determine if we're in a TTY environment (for pretty printing)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getdefaultloglevel = component "core.getDefaultLogLevel" {
                    description "Get default log level from environment or fallback to 'info'"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createpinologger = component "core.createPinoLogger" {
                    description "Create a Pino logger instance with optional pretty printing"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createlogger = component "core.createLogger" {
                    description "Create a logger instance"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getdefaultuserplugindir = component "core.getDefaultUserPluginDir" {
                    description "Default base directory for user plugins: ~/.archlette/mods This provides a standard location for external plugins and custom modules"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadmodulefrompath = component "core.loadModuleFromPath" {
                    description "Dynamically load an ESM module from a path or module specifier with security validation"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getclidir = component "core.getCliDir" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__expandtilde = component "core.expandTilde" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvearchlettepath = component "core.resolveArchlettePath" {
                    description "Core path resolver honoring Archlette rules (no file existence checks). - \"~\" -> user home - \"/\" -> absolute - else -> relative to CLI dir"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvemoduleentry = component "core.resolveModuleEntry" {
                    description "Resolve a module entry by probing: 1) Exact path 2) With extensions: .ts then .js 3) If directory: index.ts then index.js"
                    technology "function"
                    tags "Code"
                }
                default_container__core__tofileurl = component "core.toFileUrl" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__writefile = component "core.writeFile" {
                    description "Write content to a file, creating parent directories if needed."
                    technology "function"
                    tags "Code"
                }
                default_container__core__validatepathsecurity = component "core.validatePathSecurity" {
                    description "Validate path for security issues"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvesecurepath = component "core.resolveSecurePath" {
                    description "Securely resolve a user-provided path with validation"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveusercontentpath = component "core.resolveUserContentPath" {
                    description "Convenience function for resolving user content paths (themes, input files) Uses 'config-relative' strategy by default"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvepluginpath = component "core.resolvePluginPath" {
                    description "Convenience function for resolving plugin paths Uses 'cli-relative' strategy by default"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getstageentry = component "core.getStageEntry" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadextractormodule = component "core.loadExtractorModule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadvalidatormodule = component "core.loadValidatorModule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadgeneratormodule = component "core.loadGeneratorModule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadrenderermodule = component "core.loadRendererModule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loaddocmodule = component "core.loadDocModule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__getcachedir = component "core.getCacheDir" {
                    description "Get the Archlette cache directory"
                    technology "function"
                    tags "Code"
                }
                default_container__core__ensurecachedir = component "core.ensureCacheDir" {
                    description "Ensure cache directory exists"
                    technology "function"
                    tags "Code"
                }
                default_container__core__commandexistsinpath = component "core.commandExistsInPath" {
                    description "Check if a command exists in PATH"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadfile = component "core.downloadFile" {
                    description "Download a file from URL to destination"
                    technology "function"
                    tags "Code"
                }
                default_container__core__extractzip = component "core.extractZip" {
                    description "Extract a ZIP file (simple extraction for Structurizr CLI)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__makeexecutable = component "core.makeExecutable" {
                    description "Make file executable (Unix only)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadstructurizr = component "core.downloadStructurizr" {
                    description "Download and install Structurizr CLI to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadplantuml = component "core.downloadPlantUML" {
                    description "Download and install PlantUML to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findstructurizrcli = component "core.findStructurizrCLI" {
                    description "Find or download Structurizr CLI"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findplantuml = component "core.findPlantUML" {
                    description "Find or download PlantUML JAR"
                    technology "function"
                    tags "Code"
                }
                default_container__core__checkjava = component "core.checkJava" {
                    description "Verify Java is available"
                    technology "function"
                    tags "Code"
                }
                default_container__core__requirejava = component "core.requireJava" {
                    description "Validate Java is installed (throw if not)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveconfig = component "core.resolveConfig" {
                    description "For each stage, resolve includes/excludes for each node: - If node omits includes/excludes, inherit from defaults. - Add configBaseDir for resolving config-relative paths"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__markdowndocs = component "docs.markdownDocs" {
                    description "Generate markdown documentation"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__finddiagramsforview = component "docs.findDiagramsForView" {
                    description "Find diagram files for a specific view type"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__finddiagramsforcontainer = component "docs.findDiagramsForContainer" {
                    description "Find component diagrams for a specific container"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__findclassdiagramsforcomponent = component "docs.findClassDiagramsForComponent" {
                    description "Find class diagrams for a specific component"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__sanitizefilename = component "docs.sanitizeFileName" {
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__basicastroextractor = component "basic-astro.basicAstroExtractor" {
                    description "Extract architecture information from an Astro codebase"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__basicnodeextractor = component "basic_node.basicNodeExtractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__createemptyir = component "basic-python.createEmptyIR" {
                    description "Create empty IR when no files found"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__basicpython = component "basic-python.basicPython" {
                    description "Basic Python extractor Analyzes Python source code and extracts architectural components"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__basicwranglerextractor = component "basic_wrangler.basicWranglerExtractor" {
                    description "Extract deployment topology from Cloudflare Wrangler configuration files"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__loaddefaulttheme = component "generators.loadDefaultTheme" {
                    description "Load the default Structurizr theme from templates directory"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__structurizrgenerator = component "generators.structurizrGenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__preparecontainerdata = component "generators.prepareContainerData" {
                    description "Prepare container data with components, code, and relationships for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__preparecomponentview = component "generators.prepareComponentView" {
                    description "Prepare component view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__prepareclassview = component "generators.prepareClassView" {
                    description "Prepare class view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateallactorrelationships = component "generators.generateAllActorRelationships" {
                    description "Generate all actor-related relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateuniquecodename = component "generators.generateUniqueCodeName" {
                    description "Generate a unique name for a code item to avoid naming collisions"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__buildtechnologystring = component "generators.buildTechnologyString" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__sanitizeid = component "generators.sanitizeId" {
                    description "Sanitize ID for DSL (remove special characters, convert to valid identifier)"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__escapestring = component "generators.escapeString" {
                    description "Escape special characters in strings for DSL Structurizr DSL doesn't support \\n escape sequences in strings, so we replace newlines with spaces for cleaner output."
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__plantumlrender = component "renderers.plantumlRender" {
                    description "Render PlantUML files to PNG images"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__structurizrexport = component "renderers.structurizrExport" {
                    description "Export Structurizr DSL to PlantUML and Mermaid formats"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__basevalidator = component "validators.baseValidator" {
                    description "Validates the IR against the Zod schema. Throws if invalid."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractcodefromfrontmatter = component "basic-astro.extractCodeFromFrontmatter" {
                    description "Extract TypeScript/JavaScript code from Astro frontmatter Parses the frontmatter as TypeScript and uses basic-node extractors"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__createsyntheticrenderfunction = component "basic-astro.createSyntheticRenderFunction" {
                    description "Create a synthetic render function for an Astro component Every Astro component is fundamentally a server-side render function that takes props and returns HTML Function is named after the file (e.g., \"index\", \"about\", \"Header\") so each Astro file has a unique code-level representation"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractjsdocblocks = component "basic-astro.extractJSDocBlocks" {
                    description "Extract all JSDoc comment blocks from source code Matches /** ... *\\/ style comments and parses their tags"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__parsejsdocblock = component "basic-astro.parseJSDocBlock" {
                    description "Parse a single JSDoc comment block into description and tags"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractfilecomponent = component "basic-astro.extractFileComponent" {
                    description "Extract component information from frontmatter JSDoc Checks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractcomponentname = component "basic-astro.extractComponentName" {
                    description "Extract component name from a JSDoc tag value Handles formats like: - ComponentName - ComponentName - Description (space-dash-space separator) - path/to/module - My-Component (dashes in names are preserved)"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractfileactors = component "basic-astro.extractFileActors" {
                    description "Extract actors from frontmatter JSDoc Looks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__parseactortag = component "basic-astro.parseActorTag" {
                    description "Parse an"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractfilerelationships = component "basic-astro.extractFileRelationships" {
                    description "Extract relationships from frontmatter JSDoc Looks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__parseusestag = component "basic-astro.parseUsesTag" {
                    description "Parse a"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__infercomponentfrompath = component "basic-astro.inferComponentFromPath" {
                    description "Infer component name from file path - Files in subdirectories use the immediate parent folder name - Files in root directory use ROOT_COMPONENT_MARKER Examples: - /path/to/project/src/components/Button.astro -> 'components' - /path/to/project/src/Layout.astro -> ROOT_COMPONENT_MARKER"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__findsourcefiles = component "basic-astro.findSourceFiles" {
                    description "Find Astro source files matching the given patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__findpackagejsonfiles = component "basic-astro.findPackageJsonFiles" {
                    description "Find all package.json files in the workspace"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__readpackageinfo = component "basic-astro.readPackageInfo" {
                    description "Read package.json and extract metadata"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__findnearestpackage = component "basic-astro.findNearestPackage" {
                    description "Find the nearest package.json for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__parsefiles = component "basic-astro.parseFiles" {
                    description "Parse Astro files using"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractfrontmatter = component "basic-astro.extractFrontmatter" {
                    description "Extract frontmatter content from Astro file Frontmatter is the TypeScript/JavaScript code between --- markers at the top of the file Handles both Unix (\\n) and Windows (\\r\\n) line endings"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractimports = component "basic-astro.extractImports" {
                    description "Extract import statements from frontmatter"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__findslots = component "basic-astro.findSlots" {
                    description "Find slot tags in the template"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__findclientdirective = component "basic-astro.findClientDirective" {
                    description "Find client directive in component usage Examples: client:load, client:idle, client:visible, client:media, client:only"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__extractcomponentusage = component "basic-astro.extractComponentUsage" {
                    description "Extract component usage from template Finds which imported components are used in the template markup"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__maptoir = component "basic-astro.mapToIR" {
                    description "Map file extractions to ArchletteIR Transforms Astro component analysis into standardized architecture representation"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__mapclasstocodeitems = component "basic-astro.mapClassToCodeItems" {
                    description "Map a class to code items (class + methods)"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_astro__mapfunctiontocodeitem = component "basic-astro.mapFunctionToCodeItem" {
                    description "Map a function to a code item"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractclasses = component "basic_node.extractClasses" {
                    description "Extract all class declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractclass = component "basic_node.extractClass" {
                    description "Extract information from a single class declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractmethod = component "basic_node.extractMethod" {
                    description "Extract method information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractproperty = component "basic_node.extractProperty" {
                    description "Extract property information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractmethodparameter = component "basic_node.extractMethodParameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapvisibility = component "basic_node.mapVisibility" {
                    description "Map ts-morph Scope to our visibility string"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__getfilejsdocs = component "basic_node.getFileJsDocs" {
                    description "Get JSDoc comments from a source file Checks both the first statement and module-level JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfilecomponent = component "basic_node.extractFileComponent" {
                    description "Extract component information from file-level JSDoc Checks the first JSDoc comment in the file for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfileactors = component "basic_node.extractFileActors" {
                    description "Extract actors from file-level JSDoc Looks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfilerelationships = component "basic_node.extractFileRelationships" {
                    description "Extract relationships from file-level JSDoc Looks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractcomponentfromjsdoc = component "basic_node.extractComponentFromJsDoc" {
                    description "Extract component info from a JSDoc node"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractactorsfromjsdoc = component "basic_node.extractActorsFromJsDoc" {
                    description "Extract actors from a JSDoc node Parses"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parseactortag = component "basic_node.parseActorTag" {
                    description "Parse an"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractrelationshipsfromjsdoc = component "basic_node.extractRelationshipsFromJsDoc" {
                    description "Extract relationships from a JSDoc node Parses"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parseusestag = component "basic_node.parseUsesTag" {
                    description "Parse a"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractcomponentname = component "basic_node.extractComponentName" {
                    description "Extract component name from a JSDoc tag Handles formats like: -"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__infercomponentfrompath = component "basic_node.inferComponentFromPath" {
                    description "Infer component name from file path - Files in subdirectories use the immediate parent folder name - Files in root directory use a special marker that will be replaced with container name Examples: - /path/to/project/src/utils/helper.ts -> 'utils' - /path/to/project/src/index.ts -> ROOT_COMPONENT_MARKER - /path/to/project/services/api/client.ts -> 'api'"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractdocumentation = component "basic_node.extractDocumentation" {
                    description "Extract documentation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractdeprecation = component "basic_node.extractDeprecation" {
                    description "Extract deprecation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractparameterdescriptions = component "basic_node.extractParameterDescriptions" {
                    description "Extract parameter descriptions from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractreturndescription = component "basic_node.extractReturnDescription" {
                    description "Extract return description from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractparametername = component "basic_node.extractParameterName" {
                    description "Extract parameter name from"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findsourcefiles = component "basic_node.findSourceFiles" {
                    description "Find source files matching include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findpackagejsonfiles = component "basic_node.findPackageJsonFiles" {
                    description "Find package.json files within the search paths"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__readpackageinfo = component "basic_node.readPackageInfo" {
                    description "Read and parse package.json file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findnearestpackage = component "basic_node.findNearestPackage" {
                    description "Find the nearest parent package.json for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parsefiles = component "basic_node.parseFiles" {
                    description "Parse and extract information from source files"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunctions = component "basic_node.extractFunctions" {
                    description "Extract all function declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunction = component "basic_node.extractFunction" {
                    description "Extract information from a single function declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunctionparameter = component "basic_node.extractFunctionParameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractarrowfunctions = component "basic_node.extractArrowFunctions" {
                    description "Extract arrow functions assigned to const/let/var Examples: const handleClick = () => {} export const createUser = async (data) => {}"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractimports = component "basic_node.extractImports" {
                    description "Extract all import declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__maptoir = component "basic_node.mapToIR" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__deduplicaterelationships = component "basic_node.deduplicateRelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination First occurrence wins - preserves description from first relationship This allows multiple relationships between the same elements with different stereotypes"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapfunction = component "basic_node.mapFunction" {
                    description "Map a function to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapclass = component "basic_node.mapClass" {
                    description "Map a class to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapmethod = component "basic_node.mapMethod" {
                    description "Map a class method to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapimportrelationships = component "basic_node.mapImportRelationships" {
                    description "Map imports to relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__generateid = component "basic_node.generateId" {
                    description "Generate a unique ID for a code element Format: filePath:symbolName"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__getdefaultsystem = component "basic_node.getDefaultSystem" {
                    description "Get default system info from package.json if available"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extracttypealiases = component "basic_node.extractTypeAliases" {
                    description "Extract type aliases from a source file Examples: type UserRole = 'admin' | 'user' | 'guest' export type ApiResponse<T> = { data: T; status: number }"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractinterfaces = component "basic_node.extractInterfaces" {
                    description "Extract interfaces from a source file Examples: interface User { id: string; name: string } export interface ApiClient { get<T>(url: string): Promise<T> }"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__findsourcefiles = component "basic-python.findSourceFiles" {
                    description "Find source files matching include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__findpyprojectfiles = component "basic-python.findPyProjectFiles" {
                    description "Find pyproject.toml files within the search paths"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__readpyprojectinfo = component "basic-python.readPyProjectInfo" {
                    description "Read and parse pyproject.toml file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__parsepyprojecttoml = component "basic-python.parsePyProjectToml" {
                    description "Parse pyproject.toml using smol-toml library Handles full TOML spec including multiline strings, arrays, and nested tables"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__findnearestpyproject = component "basic-python.findNearestPyProject" {
                    description "Find the nearest parent pyproject.toml for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__parsefiles = component "basic-python.parseFiles" {
                    description "Parse Python files using Python AST parser script"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__runpythonparser = component "basic-python.runPythonParser" {
                    description "Run Python parser script and return JSON output"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptofileextraction = component "basic-python.mapToFileExtraction" {
                    description "Map Python parser output to FileExtraction format"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapclass = component "basic-python.mapClass" {
                    description "Map Python class to ExtractedClass"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapmethod = component "basic-python.mapMethod" {
                    description "Map Python method to ExtractedMethod"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapproperty = component "basic-python.mapProperty" {
                    description "Map Python property to ExtractedProperty"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapfunction = component "basic-python.mapFunction" {
                    description "Map Python function to ExtractedFunction"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptype = component "basic-python.mapType" {
                    description "Map Python type definition to ExtractedType"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapparameter = component "basic-python.mapParameter" {
                    description "Map Python parameter to ParameterInfo"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__parsedocstring = component "basic-python.parseDocstring" {
                    description "Parse Python docstring into DocInfo Enhanced in Phase 2 to use parsed Google/NumPy/Sphinx docstrings"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__extractdeprecation = component "basic-python.extractDeprecation" {
                    description "Extract deprecation info from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__extractreturndescription = component "basic-python.extractReturnDescription" {
                    description "Extract return description from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__getvisibility = component "basic-python.getVisibility" {
                    description "Determine visibility from Python name convention - __name: private - _name: protected - name: public"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptoir = component "basic-python.mapToIR" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapactortoir = component "basic-python.mapActorToIR" {
                    description "Map ActorInfo to Actor"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maprelationshipstoir = component "basic-python.mapRelationshipsToIR" {
                    description "Map relationships to Relationship[] Creates bidirectional actor relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__deduplicaterelationships = component "basic-python.deduplicateRelationships" {
                    description "Deduplicate relationships by source+destination"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapclasstocodeitem = component "basic-python.mapClassToCodeItem" {
                    description "Map ExtractedClass to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapmethodtocodeitem = component "basic-python.mapMethodToCodeItem" {
                    description "Map ExtractedMethod to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapfunctiontocodeitem = component "basic-python.mapFunctionToCodeItem" {
                    description "Map ExtractedFunction to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptypetocodeitem = component "basic-python.mapTypeToCodeItem" {
                    description "Map ExtractedType to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__findwranglerfiles = component "basic_wrangler.findWranglerFiles" {
                    description "Find wrangler.toml files based on include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__maptoir = component "basic_wrangler.mapToIR" {
                    description "Map wrangler configurations to ArchletteIR This creates: - Containers: One per wrangler.toml file - Deployments: One per environment (production, dev, preview, etc.) - Container Instances: One per container per environment - Container Relationships: Logical dependencies from service bindings - Deployment Relationships: Physical instance-to-instance connections"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractcontainers = component "basic_wrangler.extractContainers" {
                    description "Extract containers from wrangler configurations Creates one container per wrangler.toml file. Each container represents a Cloudflare Worker (if main exists) or other Cloudflare service."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__derivecontainertype = component "basic_wrangler.deriveContainerType" {
                    description "Derive container type from wrangler configuration Logic: - If 'main' field exists → Cloudflare Worker - Otherwise → Cloudflare Service (generic)"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractdeploymentsandinstances = component "basic_wrangler.extractDeploymentsAndInstances" {
                    description "Extract deployments and container instances Creates: - One deployment per environment - Container instances for each container in each environment"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractcontainerrelationships = component "basic_wrangler.extractContainerRelationships" {
                    description "Extract container relationships from service bindings Creates logical dependencies between containers based on service bindings. Deduplicates relationships across all environments."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractdeploymentrelationships = component "basic_wrangler.extractDeploymentRelationships" {
                    description "Extract deployment relationships from container instances Creates physical instance-to-instance relationships based on service bindings. Each relationship represents an actual runtime dependency in a specific environment."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractdescription = component "basic_wrangler.extractDescription" {
                    description "Extract description from"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__parsewranglerfile = component "basic_wrangler.parseWranglerFile" {
                    description "Parse a wrangler.toml file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__normalizeservicebindings = component "basic_wrangler.normalizeServiceBindings" {
                    description "Normalize service bindings from various formats Wrangler supports multiple binding formats: - [[services]] array (TOML array of tables) - services = [{ binding = \"...\", service = \"...\" }]"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__getenvironments = component "basic_wrangler.getEnvironments" {
                    description "Get all environments from a wrangler config Returns a list of environment names, including: - \"production\" (from root-level config if it has deployable content) - All keys from env.* sections"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__getenvironmentconfig = component "basic_wrangler.getEnvironmentConfig" {
                    description "Get configuration for a specific environment Merges root-level config with environment-specific overrides. Environment config takes precedence."
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
                default_container__extractors -> default_container__basic_astro "composed of astro extractor"
                default_container__extractors -> default_container__basic_node "composed of node extractor"
                default_container__extractors -> default_container__basic_python "composed of python extractor"
                default_container__extractors -> default_container__basic_wrangler "composed of cloudflare wrangler extractor"
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
        default_container__core -> local_system_s_unzip_utility "Uses Local System's unzip utility for external system integration"
        default_container__core -> file_system "Uses File System for external system integration"
    }

    views {
/**
 * Default Structurizr theme for Archlette
 * 
 * This theme provides a modern, professional color scheme for architecture diagrams
 * with clear visual hierarchy and accessibility considerations.
 */

theme default

// Element styles
styles {
    // Person/Actor styles
    element "Person" {
        background #08427b
        color #ffffff
        shape Person
        fontSize 22
    }

    // External System styles
    element "External System" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    element "External" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    // System styles
    element "Software System" {
        background #1168bd
        color #ffffff
        shape RoundedBox
        fontSize 24
    }

    // Container styles
    element "Container" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 20
    }

    element "Database" {
        background #438dd5
        color #ffffff
        shape Cylinder
        fontSize 20
    }

    element "Web Browser" {
        background #438dd5
        color #ffffff
        shape WebBrowser
        fontSize 20
    }

    element "Mobile App" {
        background #438dd5
        color #ffffff
        shape MobileDevicePortrait
        fontSize 20
    }

    // Component styles
    element "Component" {
        background #85bbf0
        color #000000
        shape RoundedBox
        fontSize 18
    }

    // Technology-specific styles
    element "Cloudflare Worker" {
        background #f6821f
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "Service" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "API" {
        background #85bbf0
        color #000000
        shape Hexagon
        fontSize 18
    }

    element "Queue" {
        background #85bbf0
        color #000000
        shape Pipe
        fontSize 18
    }

    // Tag-based styles
    element "Internal System" {
        background #1168bd
        color #ffffff
    }

    element "Deprecated" {
        background #cc0000
        color #ffffff
        opacity 60
    }

    element "Future" {
        background #dddddd
        color #000000
        opacity 50
        stroke #999999
        strokeWidth 2
    }

    element "Auto Generated" {
        stroke #999999
        strokeWidth 1
    }

    // Infrastructure styles
    element "Infrastructure" {
        background #92278f
        color #ffffff
        shape RoundedBox
    }

    element "Message Bus" {
        background #85bbf0
        color #000000
        shape Pipe
    }

    // Relationship styles
    relationship "Relationship" {
        color #707070
        dashed false
        routing Curved
        fontSize 12
        thickness 2
    }

    relationship "Async" {
        dashed true
        color #707070
    }

    relationship "Sync" {
        dashed false
        color #707070
    }

    relationship "Uses" {
        color #707070
        dashed false
    }

    relationship "Depends On" {
        color #707070
        dashed true
    }
}

// Diagram customization
branding {
    font "Arial"
}


        systemContext Application "SystemContext" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_system_s_unzip_utility
            include file_system
            include Application
            autoLayout
        }

        container Application "Containers" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_system_s_unzip_utility
            include file_system
            include default_container
            autoLayout
        }


        component default_container "Components_Application" {
            include user
            include filesystem
            include github_structurizr_repo
            include github_plantuml_repo
            include local_system_s_unzip_utility
            include file_system
            include default_container__cli
            include default_container__extractors
            include default_container__validators
            include default_container__generators
            include default_container__renderers
            include default_container__docs
            include default_container__core
            include default_container__basic_astro
            include default_container__basic_node
            include default_container__basic_python
            include default_container__basic_wrangler
            exclude "element.tag==Code"
            autoLayout
        }


        component default_container "Classes_default_container__cli" {
            include default_container__cli__usageandexit
            include default_container__cli__parseargs
            include default_container__cli__stagelistfromarg
            include default_container__cli__run
            autoLayout
        }


        component default_container "Classes_default_container__extractors" {
            include default_container__extractors__aggregateirs
            include default_container__extractors__deduplicatebyid
            include default_container__extractors__deduplicatebyname
            include default_container__extractors__deduplicaterelationships
            include default_container__extractors__run
            autoLayout
        }


        component default_container "Classes_default_container__validators" {
            include default_container__validators__run
            include default_container__validators__basevalidator
            autoLayout
        }


        component default_container "Classes_default_container__generators" {
            include default_container__generators__run
            include default_container__generators__loaddefaulttheme
            include default_container__generators__structurizrgenerator
            include default_container__generators__preparecontainerdata
            include default_container__generators__preparecomponentview
            include default_container__generators__prepareclassview
            include default_container__generators__generateallactorrelationships
            include default_container__generators__generateuniquecodename
            include default_container__generators__buildtechnologystring
            include default_container__generators__sanitizeid
            include default_container__generators__escapestring
            autoLayout
        }


        component default_container "Classes_default_container__renderers" {
            include default_container__renderers__run
            include default_container__renderers__plantumlrender
            include default_container__renderers__structurizrexport
            autoLayout
        }


        component default_container "Classes_default_container__docs" {
            include default_container__docs__run
            include default_container__docs__markdowndocs
            include default_container__docs__finddiagramsforview
            include default_container__docs__finddiagramsforcontainer
            include default_container__docs__findclassdiagramsforcomponent
            include default_container__docs__sanitizefilename
            autoLayout
        }


        component default_container "Classes_default_container__core" {
            include default_container__core__resolveconfigfilepath
            include default_container__core__resolveconfigbasedir
            include default_container__core__loadyamlfile
            include default_container__core__createdefaultconfig
            include default_container__core__loadconfig
            include default_container__core__nametoid
            include default_container__core__sanitizeid
            include default_container__core__istty
            include default_container__core__getdefaultloglevel
            include default_container__core__createpinologger
            include default_container__core__createlogger
            include default_container__core__getdefaultuserplugindir
            include default_container__core__loadmodulefrompath
            include default_container__core__getclidir
            include default_container__core__expandtilde
            include default_container__core__resolvearchlettepath
            include default_container__core__resolvemoduleentry
            include default_container__core__tofileurl
            include default_container__core__writefile
            include default_container__core__validatepathsecurity
            include default_container__core__resolvesecurepath
            include default_container__core__resolveusercontentpath
            include default_container__core__resolvepluginpath
            include default_container__core__getstageentry
            include default_container__core__loadextractormodule
            include default_container__core__loadvalidatormodule
            include default_container__core__loadgeneratormodule
            include default_container__core__loadrenderermodule
            include default_container__core__loaddocmodule
            include default_container__core__getcachedir
            include default_container__core__ensurecachedir
            include default_container__core__commandexistsinpath
            include default_container__core__downloadfile
            include default_container__core__extractzip
            include default_container__core__makeexecutable
            include default_container__core__downloadstructurizr
            include default_container__core__downloadplantuml
            include default_container__core__findstructurizrcli
            include default_container__core__findplantuml
            include default_container__core__checkjava
            include default_container__core__requirejava
            include default_container__core__resolveconfig
            autoLayout
        }


        component default_container "Classes_default_container__basic_astro" {
            include default_container__basic_astro__basicastroextractor
            include default_container__basic_astro__extractcodefromfrontmatter
            include default_container__basic_astro__createsyntheticrenderfunction
            include default_container__basic_astro__extractjsdocblocks
            include default_container__basic_astro__parsejsdocblock
            include default_container__basic_astro__extractfilecomponent
            include default_container__basic_astro__extractcomponentname
            include default_container__basic_astro__extractfileactors
            include default_container__basic_astro__parseactortag
            include default_container__basic_astro__extractfilerelationships
            include default_container__basic_astro__parseusestag
            include default_container__basic_astro__infercomponentfrompath
            include default_container__basic_astro__findsourcefiles
            include default_container__basic_astro__findpackagejsonfiles
            include default_container__basic_astro__readpackageinfo
            include default_container__basic_astro__findnearestpackage
            include default_container__basic_astro__parsefiles
            include default_container__basic_astro__extractfrontmatter
            include default_container__basic_astro__extractimports
            include default_container__basic_astro__findslots
            include default_container__basic_astro__findclientdirective
            include default_container__basic_astro__extractcomponentusage
            include default_container__basic_astro__maptoir
            include default_container__basic_astro__mapclasstocodeitems
            include default_container__basic_astro__mapfunctiontocodeitem
            autoLayout
        }


        component default_container "Classes_default_container__basic_node" {
            include default_container__basic_node__basicnodeextractor
            include default_container__basic_node__extractclasses
            include default_container__basic_node__extractclass
            include default_container__basic_node__extractmethod
            include default_container__basic_node__extractproperty
            include default_container__basic_node__extractmethodparameter
            include default_container__basic_node__mapvisibility
            include default_container__basic_node__getfilejsdocs
            include default_container__basic_node__extractfilecomponent
            include default_container__basic_node__extractfileactors
            include default_container__basic_node__extractfilerelationships
            include default_container__basic_node__extractcomponentfromjsdoc
            include default_container__basic_node__extractactorsfromjsdoc
            include default_container__basic_node__parseactortag
            include default_container__basic_node__extractrelationshipsfromjsdoc
            include default_container__basic_node__parseusestag
            include default_container__basic_node__extractcomponentname
            include default_container__basic_node__infercomponentfrompath
            include default_container__basic_node__extractdocumentation
            include default_container__basic_node__extractdeprecation
            include default_container__basic_node__extractparameterdescriptions
            include default_container__basic_node__extractreturndescription
            include default_container__basic_node__extractparametername
            include default_container__basic_node__findsourcefiles
            include default_container__basic_node__findpackagejsonfiles
            include default_container__basic_node__readpackageinfo
            include default_container__basic_node__findnearestpackage
            include default_container__basic_node__parsefiles
            include default_container__basic_node__extractfunctions
            include default_container__basic_node__extractfunction
            include default_container__basic_node__extractfunctionparameter
            include default_container__basic_node__extractarrowfunctions
            include default_container__basic_node__extractimports
            include default_container__basic_node__maptoir
            include default_container__basic_node__deduplicaterelationships
            include default_container__basic_node__mapfunction
            include default_container__basic_node__mapclass
            include default_container__basic_node__mapmethod
            include default_container__basic_node__mapimportrelationships
            include default_container__basic_node__generateid
            include default_container__basic_node__getdefaultsystem
            include default_container__basic_node__extracttypealiases
            include default_container__basic_node__extractinterfaces
            autoLayout
        }


        component default_container "Classes_default_container__basic_python" {
            include default_container__basic_python__createemptyir
            include default_container__basic_python__basicpython
            include default_container__basic_python__findsourcefiles
            include default_container__basic_python__findpyprojectfiles
            include default_container__basic_python__readpyprojectinfo
            include default_container__basic_python__parsepyprojecttoml
            include default_container__basic_python__findnearestpyproject
            include default_container__basic_python__parsefiles
            include default_container__basic_python__runpythonparser
            include default_container__basic_python__maptofileextraction
            include default_container__basic_python__mapclass
            include default_container__basic_python__mapmethod
            include default_container__basic_python__mapproperty
            include default_container__basic_python__mapfunction
            include default_container__basic_python__maptype
            include default_container__basic_python__mapparameter
            include default_container__basic_python__parsedocstring
            include default_container__basic_python__extractdeprecation
            include default_container__basic_python__extractreturndescription
            include default_container__basic_python__getvisibility
            include default_container__basic_python__maptoir
            include default_container__basic_python__mapactortoir
            include default_container__basic_python__maprelationshipstoir
            include default_container__basic_python__deduplicaterelationships
            include default_container__basic_python__mapclasstocodeitem
            include default_container__basic_python__mapmethodtocodeitem
            include default_container__basic_python__mapfunctiontocodeitem
            include default_container__basic_python__maptypetocodeitem
            autoLayout
        }


        component default_container "Classes_default_container__basic_wrangler" {
            include default_container__basic_wrangler__basicwranglerextractor
            include default_container__basic_wrangler__findwranglerfiles
            include default_container__basic_wrangler__maptoir
            include default_container__basic_wrangler__extractcontainers
            include default_container__basic_wrangler__derivecontainertype
            include default_container__basic_wrangler__extractdeploymentsandinstances
            include default_container__basic_wrangler__extractcontainerrelationships
            include default_container__basic_wrangler__extractdeploymentrelationships
            include default_container__basic_wrangler__extractdescription
            include default_container__basic_wrangler__parsewranglerfile
            include default_container__basic_wrangler__normalizeservicebindings
            include default_container__basic_wrangler__getenvironments
            include default_container__basic_wrangler__getenvironmentconfig
            autoLayout
        }

    }

}
