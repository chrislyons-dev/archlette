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
                default_container__core_config = component "core/config" {
                    technology "module"
                }
                default_container__core = component "core" {
                    description "Dynamic ESM module loader | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types"
                    technology "module"
                }
                default_container__core_path = component "core/path" {
                    technology "module"
                }
                default_container__basic_node = component "basic_node" {
                    description "TypeScript/JavaScript code extractor"
                    technology "module"
                }
                default_container__basic = component "basic" {
                    description "Basic Python Extractor for Archlette\nExtracts architecture information from Python source code"
                    technology "module"
                }
                default_container__basic_wrangler = component "basic_wrangler" {
                    description "Cloudflare Wrangler deployment extractor"
                    technology "module"
                }
                default_container__basic_python = component "basic_python" {
                    technology "module"
                }

                # Code elements (classes, functions)
                default_container__cli__usageandexit = component "default_container__cli__usageandexit" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__parseargs = component "default_container__cli__parseargs" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__stagelistfromarg = component "default_container__cli__stagelistfromarg" {
                    technology "function"
                    tags "Code"
                }
                default_container__cli__run = component "default_container__cli__run" {
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__aggregateirs = component "default_container__extractors__aggregateirs" {
                    description "Aggregate multiple ArchletteIR objects into a single unified IR"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicatebyid = component "default_container__extractors__deduplicatebyid" {
                    description "Deduplicate array of entities by their ID field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicatebyname = component "default_container__extractors__deduplicatebyname" {
                    description "Deduplicate array of entities by their name field"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__deduplicaterelationships = component "default_container__extractors__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__run = component "default_container__extractors__run" {
                    description "Execute the extraction stage"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__run = component "default_container__validators__run" {
                    description "Execute the validation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__run = component "default_container__generators__run" {
                    description "Execute the generation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__run = component "default_container__renderers__run" {
                    description "Execute the rendering stage"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__run = component "default_container__docs__run" {
                    description "Execute the documentation stage"
                    technology "function"
                    tags "Code"
                }
                default_container__core_config__resolveconfigfilepath = component "default_container__core_config__resolveconfigfilepath" {
                    description "Resolve config file path from CLI arguments"
                    technology "function"
                    tags "Code"
                }
                default_container__core_config__resolveconfigbasedir = component "default_container__core_config__resolveconfigbasedir" {
                    description "Determine base directory for resolving config-relative paths\n\nLogic:\n- If using default template: CWD (user's project directory)\n- If user provided config file: config file's directory\n- Fallback: CWD"
                    technology "function"
                    tags "Code"
                }
                default_container__core_config__loadyamlfile = component "default_container__core_config__loadyamlfile" {
                    description "Load and parse YAML config file"
                    technology "function"
                    tags "Code"
                }
                default_container__core_config__createdefaultconfig = component "default_container__core_config__createdefaultconfig" {
                    description "Create minimal default configuration when no config file is found"
                    technology "function"
                    tags "Code"
                }
                default_container__core_config__loadconfig = component "default_container__core_config__loadconfig" {
                    description "Load configuration from file path (high-level API)\n\nThis is the main entry point for config loading. It handles:\n1. Config file path resolution (default vs user-provided)\n2. Base directory determination\n3. YAML parsing\n4. Config validation and resolution\n5. Fallback to default config"
                    technology "function"
                    tags "Code"
                }
                default_container__core__nametoid = component "default_container__core__nametoid" {
                    description "Convert a name to a normalized ID\nUsed for consistent ID generation across extractors and mappers"
                    technology "function"
                    tags "Code"
                }
                default_container__core__sanitizeid = component "default_container__core__sanitizeid" {
                    description "Sanitize ID for DSL and code identifiers (preserves underscores)\nUsed for Python code identifiers where underscores are significant"
                    technology "function"
                    tags "Code"
                }
                default_container__core__istty = component "default_container__core__istty" {
                    description "Determine if we're in a TTY environment (for pretty printing)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getdefaultloglevel = component "default_container__core__getdefaultloglevel" {
                    description "Get default log level from environment or fallback to 'info'"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createpinologger = component "default_container__core__createpinologger" {
                    description "Create a Pino logger instance with optional pretty printing"
                    technology "function"
                    tags "Code"
                }
                default_container__core__createlogger = component "default_container__core__createlogger" {
                    description "Create a logger instance"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getdefaultuserplugindir = component "default_container__core__getdefaultuserplugindir" {
                    description "Default base directory for user plugins: ~/.archlette/mods\nThis provides a standard location for external plugins and custom modules"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadmodulefrompath = component "default_container__core__loadmodulefrompath" {
                    description "Dynamically load an ESM module from a path or module specifier with security validation"
                    technology "function"
                    tags "Code"
                }
                default_container__core__getclidir = component "default_container__core__getclidir" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__expandtilde = component "default_container__core__expandtilde" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvearchlettepath = component "default_container__core__resolvearchlettepath" {
                    description "Core path resolver honoring Archlette rules (no file existence checks).\n- \"~\"  -> user home\n- \"/\"  -> absolute\n- else -> relative to CLI dir"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolvemoduleentry = component "default_container__core__resolvemoduleentry" {
                    description "Resolve a module entry by probing:\n1) Exact path\n2) With extensions: .ts then .js\n3) If directory: index.ts then index.js"
                    technology "function"
                    tags "Code"
                }
                default_container__core__tofileurl = component "default_container__core__tofileurl" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__writefile = component "default_container__core__writefile" {
                    description "Write content to a file, creating parent directories if needed."
                    technology "function"
                    tags "Code"
                }
                default_container__core_path__validatepathsecurity = component "default_container__core_path__validatepathsecurity" {
                    description "Validate path for security issues"
                    technology "function"
                    tags "Code"
                }
                default_container__core_path__resolvesecurepath = component "default_container__core_path__resolvesecurepath" {
                    description "Securely resolve a user-provided path with validation"
                    technology "function"
                    tags "Code"
                }
                default_container__core_path__resolveusercontentpath = component "default_container__core_path__resolveusercontentpath" {
                    description "Convenience function for resolving user content paths (themes, input files)\nUses 'config-relative' strategy by default"
                    technology "function"
                    tags "Code"
                }
                default_container__core_path__resolvepluginpath = component "default_container__core_path__resolvepluginpath" {
                    description "Convenience function for resolving plugin paths\nUses 'cli-relative' strategy by default"
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadextractormodule = component "default_container__core__loadextractormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadvalidatormodule = component "default_container__core__loadvalidatormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadgeneratormodule = component "default_container__core__loadgeneratormodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loadrenderermodule = component "default_container__core__loadrenderermodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__loaddocmodule = component "default_container__core__loaddocmodule" {
                    technology "function"
                    tags "Code"
                }
                default_container__core__getcachedir = component "default_container__core__getcachedir" {
                    description "Get the Archlette cache directory"
                    technology "function"
                    tags "Code"
                }
                default_container__core__ensurecachedir = component "default_container__core__ensurecachedir" {
                    description "Ensure cache directory exists"
                    technology "function"
                    tags "Code"
                }
                default_container__core__commandexistsinpath = component "default_container__core__commandexistsinpath" {
                    description "Check if a command exists in PATH"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadfile = component "default_container__core__downloadfile" {
                    description "Download a file from URL to destination"
                    technology "function"
                    tags "Code"
                }
                default_container__core__extractzip = component "default_container__core__extractzip" {
                    description "Extract a ZIP file (simple extraction for Structurizr CLI)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__makeexecutable = component "default_container__core__makeexecutable" {
                    description "Make file executable (Unix only)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadstructurizr = component "default_container__core__downloadstructurizr" {
                    description "Download and install Structurizr CLI to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__downloadplantuml = component "default_container__core__downloadplantuml" {
                    description "Download and install PlantUML to cache"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findstructurizrcli = component "default_container__core__findstructurizrcli" {
                    description "Find or download Structurizr CLI"
                    technology "function"
                    tags "Code"
                }
                default_container__core__findplantuml = component "default_container__core__findplantuml" {
                    description "Find or download PlantUML JAR"
                    technology "function"
                    tags "Code"
                }
                default_container__core__checkjava = component "default_container__core__checkjava" {
                    description "Verify Java is available"
                    technology "function"
                    tags "Code"
                }
                default_container__core__requirejava = component "default_container__core__requirejava" {
                    description "Validate Java is installed (throw if not)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__resolveconfig = component "default_container__core__resolveconfig" {
                    description "For each stage, resolve includes/excludes for each node:\n  - If node omits includes/excludes, inherit from defaults.\n  - Add configBaseDir for resolving config-relative paths"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__markdowndocs = component "default_container__docs__markdowndocs" {
                    description "Generate markdown documentation"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__finddiagramsforview = component "default_container__docs__finddiagramsforview" {
                    description "Find diagram files for a specific view type"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__finddiagramsforcontainer = component "default_container__docs__finddiagramsforcontainer" {
                    description "Find component diagrams for a specific container"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__findclassdiagramsforcomponent = component "default_container__docs__findclassdiagramsforcomponent" {
                    description "Find class diagrams for a specific component"
                    technology "function"
                    tags "Code"
                }
                default_container__docs__sanitizefilename = component "default_container__docs__sanitizefilename" {
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__basicnodeextractor = component "default_container__basic_node__basicnodeextractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__createemptyir = component "default_container__basic__createemptyir" {
                    description "Create empty IR when no files found"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__basicpython = component "default_container__basic__basicpython" {
                    description "Basic Python extractor\nAnalyzes Python source code and extracts architectural components"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__basicwranglerextractor = component "default_container__basic_wrangler__basicwranglerextractor" {
                    description "Extract deployment topology from Cloudflare Wrangler configuration files"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__loaddefaulttheme = component "default_container__generators__loaddefaulttheme" {
                    description "Load the default Structurizr theme from templates directory"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__structurizrgenerator = component "default_container__generators__structurizrgenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__preparecontainerdata = component "default_container__generators__preparecontainerdata" {
                    description "Prepare container data with components, code, and relationships for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__preparecomponentview = component "default_container__generators__preparecomponentview" {
                    description "Prepare component view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__prepareclassview = component "default_container__generators__prepareclassview" {
                    description "Prepare class view data for template"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateallactorrelationships = component "default_container__generators__generateallactorrelationships" {
                    description "Generate all actor-related relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateuniquecodename = component "default_container__generators__generateuniquecodename" {
                    description "Generate a unique name for a code item to avoid naming collisions"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__buildtechnologystring = component "default_container__generators__buildtechnologystring" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__sanitizeid = component "default_container__generators__sanitizeid" {
                    description "Sanitize ID for DSL (remove special characters, convert to valid identifier)"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__escapestring = component "default_container__generators__escapestring" {
                    description "Escape special characters in strings for DSL"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__plantumlrender = component "default_container__renderers__plantumlrender" {
                    description "Render PlantUML files to PNG images"
                    technology "function"
                    tags "Code"
                }
                default_container__renderers__structurizrexport = component "default_container__renderers__structurizrexport" {
                    description "Export Structurizr DSL to PlantUML and Mermaid formats"
                    technology "function"
                    tags "Code"
                }
                default_container__validators__basevalidator = component "default_container__validators__basevalidator" {
                    description "Validates the IR against the Zod schema. Throws if invalid."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractclasses = component "default_container__basic_node__extractclasses" {
                    description "Extract all class declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractclass = component "default_container__basic_node__extractclass" {
                    description "Extract information from a single class declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractmethod = component "default_container__basic_node__extractmethod" {
                    description "Extract method information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractproperty = component "default_container__basic_node__extractproperty" {
                    description "Extract property information from a class"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractmethodparameter = component "default_container__basic_node__extractmethodparameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapvisibility = component "default_container__basic_node__mapvisibility" {
                    description "Map ts-morph Scope to our visibility string"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__getfilejsdocs = component "default_container__basic_node__getfilejsdocs" {
                    description "Get JSDoc comments from a source file\nChecks both the first statement and module-level JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfilecomponent = component "default_container__basic_node__extractfilecomponent" {
                    description "Extract component information from file-level JSDoc\nChecks the first JSDoc comment in the file for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfileactors = component "default_container__basic_node__extractfileactors" {
                    description "Extract actors from file-level JSDoc\nLooks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfilerelationships = component "default_container__basic_node__extractfilerelationships" {
                    description "Extract relationships from file-level JSDoc\nLooks for"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractcomponentfromjsdoc = component "default_container__basic_node__extractcomponentfromjsdoc" {
                    description "Extract component info from a JSDoc node"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractactorsfromjsdoc = component "default_container__basic_node__extractactorsfromjsdoc" {
                    description "Extract actors from a JSDoc node\nParses"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parseactortag = component "default_container__basic_node__parseactortag" {
                    description "Parse an"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractrelationshipsfromjsdoc = component "default_container__basic_node__extractrelationshipsfromjsdoc" {
                    description "Extract relationships from a JSDoc node\nParses"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parseusestag = component "default_container__basic_node__parseusestag" {
                    description "Parse a"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractcomponentname = component "default_container__basic_node__extractcomponentname" {
                    description "Extract component name from a JSDoc tag\nHandles formats like:\n-"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractdocumentation = component "default_container__basic_node__extractdocumentation" {
                    description "Extract documentation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractdeprecation = component "default_container__basic_node__extractdeprecation" {
                    description "Extract deprecation information from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractparameterdescriptions = component "default_container__basic_node__extractparameterdescriptions" {
                    description "Extract parameter descriptions from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractreturndescription = component "default_container__basic_node__extractreturndescription" {
                    description "Extract return description from JSDoc"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractparametername = component "default_container__basic_node__extractparametername" {
                    description "Extract parameter name from"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findsourcefiles = component "default_container__basic_node__findsourcefiles" {
                    description "Find source files matching include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findpackagejsonfiles = component "default_container__basic_node__findpackagejsonfiles" {
                    description "Find package.json files within the search paths"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__readpackageinfo = component "default_container__basic_node__readpackageinfo" {
                    description "Read and parse package.json file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__findnearestpackage = component "default_container__basic_node__findnearestpackage" {
                    description "Find the nearest parent package.json for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__parsefiles = component "default_container__basic_node__parsefiles" {
                    description "Parse and extract information from source files"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunctions = component "default_container__basic_node__extractfunctions" {
                    description "Extract all function declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunction = component "default_container__basic_node__extractfunction" {
                    description "Extract information from a single function declaration"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractfunctionparameter = component "default_container__basic_node__extractfunctionparameter" {
                    description "Extract parameter information"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractarrowfunctions = component "default_container__basic_node__extractarrowfunctions" {
                    description "Extract arrow functions assigned to const/let/var\nExamples:\n  const handleClick = () => {}\n  export const createUser = async (data) => {}"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractimports = component "default_container__basic_node__extractimports" {
                    description "Extract all import declarations from a source file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__maptoir = component "default_container__basic_node__maptoir" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__deduplicaterelationships = component "default_container__basic_node__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination\nFirst occurrence wins - preserves description from first relationship\nThis allows multiple relationships between the same elements with different stereotypes"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapfunction = component "default_container__basic_node__mapfunction" {
                    description "Map a function to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapclass = component "default_container__basic_node__mapclass" {
                    description "Map a class to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapmethod = component "default_container__basic_node__mapmethod" {
                    description "Map a class method to a CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__mapimportrelationships = component "default_container__basic_node__mapimportrelationships" {
                    description "Map imports to relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__generateid = component "default_container__basic_node__generateid" {
                    description "Generate a unique ID for a code element\nFormat: filePath:symbolName"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__getdefaultsystem = component "default_container__basic_node__getdefaultsystem" {
                    description "Get default system info from package.json if available"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extracttypealiases = component "default_container__basic_node__extracttypealiases" {
                    description "Extract type aliases from a source file\nExamples:\n  type UserRole = 'admin' | 'user' | 'guest'\n  export type ApiResponse<T> = { data: T; status: number }"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_node__extractinterfaces = component "default_container__basic_node__extractinterfaces" {
                    description "Extract interfaces from a source file\nExamples:\n  interface User { id: string; name: string }\n  export interface ApiClient { get<T>(url: string): Promise<T> }"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__findsourcefiles = component "default_container__basic__findsourcefiles" {
                    description "Find source files matching include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__findpyprojectfiles = component "default_container__basic__findpyprojectfiles" {
                    description "Find pyproject.toml files within the search paths"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__readpyprojectinfo = component "default_container__basic__readpyprojectinfo" {
                    description "Read and parse pyproject.toml file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__parsepyprojecttoml = component "default_container__basic__parsepyprojecttoml" {
                    description "Simple TOML parser for pyproject.toml\nOnly handles the subset we need: [project] and [tool.poetry] sections"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__findnearestpyproject = component "default_container__basic__findnearestpyproject" {
                    description "Find the nearest parent pyproject.toml for a given file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__parsefiles = component "default_container__basic_python__parsefiles" {
                    description "Parse Python files using Python AST parser script"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__runpythonparser = component "default_container__basic_python__runpythonparser" {
                    description "Run Python parser script and return JSON output"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptofileextraction = component "default_container__basic_python__maptofileextraction" {
                    description "Map Python parser output to FileExtraction format"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapclass = component "default_container__basic_python__mapclass" {
                    description "Map Python class to ExtractedClass"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapmethod = component "default_container__basic_python__mapmethod" {
                    description "Map Python method to ExtractedMethod"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapproperty = component "default_container__basic_python__mapproperty" {
                    description "Map Python property to ExtractedProperty"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapfunction = component "default_container__basic_python__mapfunction" {
                    description "Map Python function to ExtractedFunction"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__maptype = component "default_container__basic_python__maptype" {
                    description "Map Python type definition to ExtractedType"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__mapparameter = component "default_container__basic_python__mapparameter" {
                    description "Map Python parameter to ParameterInfo"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__parsedocstring = component "default_container__basic_python__parsedocstring" {
                    description "Parse Python docstring into DocInfo\nEnhanced in Phase 2 to use parsed Google/NumPy/Sphinx docstrings"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__extractdeprecation = component "default_container__basic_python__extractdeprecation" {
                    description "Extract deprecation info from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__extractreturndescription = component "default_container__basic_python__extractreturndescription" {
                    description "Extract return description from docstring"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_python__getvisibility = component "default_container__basic_python__getvisibility" {
                    description "Determine visibility from Python name convention\n- __name: private\n- _name: protected\n- name: public"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__maptoir = component "default_container__basic__maptoir" {
                    description "Map file extractions to ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapactortoir = component "default_container__basic__mapactortoir" {
                    description "Map ActorInfo to Actor"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__maprelationshipstoir = component "default_container__basic__maprelationshipstoir" {
                    description "Map relationships to Relationship[]\nCreates bidirectional actor relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__deduplicaterelationships = component "default_container__basic__deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapclasstocodeitem = component "default_container__basic__mapclasstocodeitem" {
                    description "Map ExtractedClass to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapmethodtocodeitem = component "default_container__basic__mapmethodtocodeitem" {
                    description "Map ExtractedMethod to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__mapfunctiontocodeitem = component "default_container__basic__mapfunctiontocodeitem" {
                    description "Map ExtractedFunction to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic__maptypetocodeitem = component "default_container__basic__maptypetocodeitem" {
                    description "Map ExtractedType to CodeItem"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__findwranglerfiles = component "default_container__basic_wrangler__findwranglerfiles" {
                    description "Find wrangler.toml files based on include/exclude patterns"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__maptoir = component "default_container__basic_wrangler__maptoir" {
                    description "Map wrangler configurations to ArchletteIR\n\nThis creates:\n- Containers: One per wrangler.toml file\n- Deployments: One per environment (production, dev, preview, etc.)\n- Container Instances: One per container per environment\n- Container Relationships: Logical dependencies from service bindings\n- Deployment Relationships: Physical instance-to-instance connections"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractcontainers = component "default_container__basic_wrangler__extractcontainers" {
                    description "Extract containers from wrangler configurations\n\nCreates one container per wrangler.toml file.\nEach container represents a Cloudflare Worker."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__buildcontainerdescription = component "default_container__basic_wrangler__buildcontainerdescription" {
                    description "Build a descriptive summary for a container"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractdeploymentsandinstances = component "default_container__basic_wrangler__extractdeploymentsandinstances" {
                    description "Extract deployments and container instances\n\nCreates:\n- One deployment per environment\n- Container instances for each container in each environment"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractcontainerrelationships = component "default_container__basic_wrangler__extractcontainerrelationships" {
                    description "Extract container relationships from service bindings\n\nCreates logical dependencies between containers based on service bindings.\nDeduplicates relationships across all environments."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__extractdeploymentrelationships = component "default_container__basic_wrangler__extractdeploymentrelationships" {
                    description "Extract deployment relationships from container instances\n\nCreates physical instance-to-instance relationships based on service bindings.\nEach relationship represents an actual runtime dependency in a specific environment."
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__parsewranglerfile = component "default_container__basic_wrangler__parsewranglerfile" {
                    description "Parse a wrangler.toml file"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__normalizeservicebindings = component "default_container__basic_wrangler__normalizeservicebindings" {
                    description "Normalize service bindings from various formats\n\nWrangler supports multiple binding formats:\n- [[services]] array (TOML array of tables)\n- services = [{ binding = \"...\", service = \"...\" }]"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__getenvironments = component "default_container__basic_wrangler__getenvironments" {
                    description "Get all environments from a wrangler config\n\nReturns a list of environment names, including:\n- \"production\" (from root-level config if it has deployable content)\n- All keys from env.* sections"
                    technology "function"
                    tags "Code"
                }
                default_container__basic_wrangler__getenvironmentconfig = component "default_container__basic_wrangler__getenvironmentconfig" {
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
            include default_container__core_config
            include default_container__core
            include default_container__core_path
            include default_container__basic_node
            include default_container__basic
            include default_container__basic_wrangler
            include default_container__basic_python
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


        component default_container "Classes_default_container__core_config" {
            include default_container__core_config__resolveconfigfilepath
            include default_container__core_config__resolveconfigbasedir
            include default_container__core_config__loadyamlfile
            include default_container__core_config__createdefaultconfig
            include default_container__core_config__loadconfig
            autoLayout
        }


        component default_container "Classes_default_container__core" {
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


        component default_container "Classes_default_container__core_path" {
            include default_container__core_path__validatepathsecurity
            include default_container__core_path__resolvesecurepath
            include default_container__core_path__resolveusercontentpath
            include default_container__core_path__resolvepluginpath
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


        component default_container "Classes_default_container__basic" {
            include default_container__basic__createemptyir
            include default_container__basic__basicpython
            include default_container__basic__findsourcefiles
            include default_container__basic__findpyprojectfiles
            include default_container__basic__readpyprojectinfo
            include default_container__basic__parsepyprojecttoml
            include default_container__basic__findnearestpyproject
            include default_container__basic__maptoir
            include default_container__basic__mapactortoir
            include default_container__basic__maprelationshipstoir
            include default_container__basic__deduplicaterelationships
            include default_container__basic__mapclasstocodeitem
            include default_container__basic__mapmethodtocodeitem
            include default_container__basic__mapfunctiontocodeitem
            include default_container__basic__maptypetocodeitem
            autoLayout
        }


        component default_container "Classes_default_container__basic_wrangler" {
            include default_container__basic_wrangler__basicwranglerextractor
            include default_container__basic_wrangler__findwranglerfiles
            include default_container__basic_wrangler__maptoir
            include default_container__basic_wrangler__extractcontainers
            include default_container__basic_wrangler__buildcontainerdescription
            include default_container__basic_wrangler__extractdeploymentsandinstances
            include default_container__basic_wrangler__extractcontainerrelationships
            include default_container__basic_wrangler__extractdeploymentrelationships
            include default_container__basic_wrangler__parsewranglerfile
            include default_container__basic_wrangler__normalizeservicebindings
            include default_container__basic_wrangler__getenvironments
            include default_container__basic_wrangler__getenvironmentconfig
            autoLayout
        }


        component default_container "Classes_default_container__basic_python" {
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
            autoLayout
        }

    }

}
