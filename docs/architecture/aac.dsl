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
                    description "ArchletteIR aggregation utilities | Extraction stage of the AAC pipeline | TypeScript/JavaScript code extractor | Cloudflare Wrangler deployment extractor"
                    technology "module"
                }
                default_container__validators = component "validators" {
                    description "Validation stage of the AAC pipeline | Base IR validator for Archlette pipeline"
                    technology "module"
                }
                default_container__generators = component "generators" {
                    description "Generation stage of the AAC pipeline | Structurizr DSL Generator"
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
                default_container__core__formatTimestamp = component "core__formattimestamp" {
                    description "Format timestamp as ISO 8601 (local time)"
                    technology "function"
                    tags "Code"
                }
                default_container__core__formatLogMessage = component "core__formatlogmessage" {
                    description "Format log message with timestamp, level, and context"
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
                default_container__extractors__basicNodeExtractor = component "extractors__basicnodeextractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                default_container__extractors__basicWranglerExtractor = component "extractors__basicwranglerextractor" {
                    description "Extract deployment topology from Cloudflare Wrangler configuration files"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__structurizrGenerator = component "generators__structurizrgenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateAllActorRelationships = component "generators__generateallactorrelationships" {
                    description "Generate all actor-related relationships (bidirectional)\n\nIncludes:\n1. Actor → Component (from actor.targets) - users interacting with system\n2. Component → Actor (from componentRelationships) - system using external actors\n\nStructurizr automatically aggregates relationships in views:\n- System Context view: Shows as actor ↔ system\n- Container view: Shows as actor ↔ container\n- Component view: Shows actual actor ↔ component relationships"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateModel = component "generators__generatemodel" {
                    description "Generate the model section of the DSL"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateViews = component "generators__generateviews" {
                    description "Generate the views section of the DSL"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateSystemContextView = component "generators__generatesystemcontextview" {
                    description "Generate System Context view\n\nShows actors and the system boundary. Structurizr automatically aggregates\nactor → component relationships to actor → system for this view since\ncomponents are not explicitly included."
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateContainerView = component "generators__generatecontainerview" {
                    description "Generate Container view\n\nShows actors, containers, and their relationships. Actor → component\nrelationships are automatically aggregated to actor → container level\nby Structurizr since components are not shown in this view."
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateComponentView = component "generators__generatecomponentview" {
                    description "Generate Component view for a container (excludes Code elements)\n\nShows actors, components within the container, and their relationships.\nActor → component relationships are shown explicitly at this level.\nCode elements are excluded to keep the view focused on architecture."
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateClassView = component "generators__generateclassview" {
                    description "Generate Class view for a component (only Code elements within that component)\nThis supports the drill-down model: System → Container → Component → Code\n\nNote: Component views in Structurizr require a container ID, not a component ID.\nWe use the component's container and filter to show only this component's code."
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateActor = component "generators__generateactor" {
                    description "Generate DSL for an actor (person or external system)"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateContainer = component "generators__generatecontainer" {
                    description "Generate DSL for a container with its components"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateComponent = component "generators__generatecomponent" {
                    description "Generate DSL for a component"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateCodeAsComponent = component "generators__generatecodeascomponent" {
                    description "Generate DSL for a code item as a component\nAlways tagged with \"Code\" to separate from logical components in views"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateUniqueCodeName = component "generators__generateuniquecodename" {
                    description "Generate a unique name for a code item to avoid naming collisions\n\nHandles both hierarchical IDs and file-path-based IDs:\n- Hierarchical: \"container::component::codeName\"\n- File-based: \"C:/path/to/file.ts:functionName\""
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateRelationship = component "generators__generaterelationship" {
                    description "Generate DSL for a relationship"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__buildTechnologyString = component "generators__buildtechnologystring" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                default_container__generators__generateDeployment = component "generators__generatedeployment" {
                    description "Generate DSL for a deployment environment\n\nSupports both legacy `nodes` format and new `instances` format.\nGenerates deployment relationships between container instances."
                    technology "function"
                    tags "Code"
                }
                default_container__generators__sanitizeId = component "generators__sanitizeid" {
                    description "Sanitize ID for DSL (remove special characters, convert to camelCase)"
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

                # Component relationships
                default_container__cli -> default_container__extractors "Analyzes source code to extract architecture components"
                default_container__cli -> default_container__validators "Validates and enriches intermediate representation"
                default_container__cli -> default_container__generators "Transforms IR into DSL formats"
                default_container__cli -> default_container__renderers "Converts DSL to visual diagrams"
                default_container__cli -> default_container__core "Provides shared utilities, types, and module loading"
                default_container__extractors -> default_container__core "Provides IR types, validation schemas, and module loading"
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
            include default_container__extractors__basicNodeExtractor
            include default_container__extractors__basicWranglerExtractor
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
            include default_container__generators__generateAllActorRelationships
            include default_container__generators__generateModel
            include default_container__generators__generateViews
            include default_container__generators__generateSystemContextView
            include default_container__generators__generateContainerView
            include default_container__generators__generateComponentView
            include default_container__generators__generateClassView
            include default_container__generators__generateActor
            include default_container__generators__generateContainer
            include default_container__generators__generateComponent
            include default_container__generators__generateCodeAsComponent
            include default_container__generators__generateUniqueCodeName
            include default_container__generators__generateRelationship
            include default_container__generators__buildTechnologyString
            include default_container__generators__generateDeployment
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
            include default_container__core__formatTimestamp
            include default_container__core__formatLogMessage
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

    }

}