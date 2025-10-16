workspace "@chrislyons-dev/archlette" "Architecture-as-Code toolkit for automated diagrams, docs, and releases." {

    model {
        # External actors
        user = person "User" "End user who runs archlette commands"
        filesystem = softwareSystem "FileSystem" "File system for reading and writing files" "External"

        # @chrislyons-dev/archlette System
        _chrislyons_dev_archlette = softwareSystem "@chrislyons-dev/archlette" {
            description "Architecture-as-Code toolkit for automated diagrams, docs, and releases."

            # Containers
            default_container = container "@chrislyons-dev/archlette" {
                description "Architecture-as-Code toolkit for automated diagrams, docs, and releases."
                technology "Application"
                tags "Auto-generated"

                # Components
                cli = component "CLI" {
                    description "Archlette CLI - Architecture-as-Code toolkit"
                    technology "module"
                }
                extractors = component "extractors" {
                    description "ArchletteIR aggregation utilities"
                    technology "module"
                }
                validators = component "validators" {
                    description "Validation stage of the AAC pipeline"
                    technology "module"
                }
                generators = component "generators" {
                    description "Generation stage of the AAC pipeline"
                    technology "module"
                }
                renderers = component "renderers" {
                    description "Render stage of the AAC pipeline"
                    technology "module"
                }
                docs = component "docs" {
                    description "Documentation stage of the AAC pipeline"
                    technology "module"
                }
                core = component "core" {
                    technology "module"
                }

                # Code elements (classes, functions)
                C__Users_chris_git_archlette_src_cli_ts_usageAndExit = component "cli.ts::usageandexit" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_parseArgs = component "cli.ts::parseargs" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_stageListFromArg = component "cli.ts::stagelistfromarg" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_loadYamlIfExists = component "cli.ts::loadyamlifexists" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_run = component "cli.ts::run" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_aggregateIRs = component "1-extract/aggregator.ts::aggregateirs" {
                    description "Aggregate multiple ArchletteIR objects into a single unified IR"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateById = component "1-extract/aggregator.ts::deduplicatebyid" {
                    description "Deduplicate array of entities by their ID field"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateByName = component "1-extract/aggregator.ts::deduplicatebyname" {
                    description "Deduplicate array of entities by their name field"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateRelationships = component "1-extract/aggregator.ts::deduplicaterelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_createEmptyIR = component "1-extract/aggregator.ts::createemptyir" {
                    description "Create an empty but valid ArchletteIR structure"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_index_ts_run = component "1-extract/index.ts::run" {
                    description "Execute the extraction stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_2_validate_index_ts_run = component "2-validate/index.ts::run" {
                    description "Execute the validation stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_3_generate_index_ts_run = component "3-generate/index.ts::run" {
                    description "Execute the generation stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_4_render_index_ts_run = component "4-render/index.ts::run" {
                    description "Execute the rendering stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_5_docs_index_ts_run = component "5-docs/index.ts::run" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_formatTimestamp = component "logger.ts::formattimestamp" {
                    description "Format timestamp as ISO 8601 (local time)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_formatLogMessage = component "logger.ts::formatlogmessage" {
                    description "Format log message with timestamp, level, and context"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_createLogger = component "logger.ts::createlogger" {
                    description "Create a logger instance"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_module_loader_ts_loadModuleFromPath = component "module-loader.ts::loadmodulefrompath" {
                    description "Dynamically load an ESM module from a path or module specifier"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_getCliDir = component "path-resolver.ts::getclidir" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_expandTilde = component "path-resolver.ts::expandtilde" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveArchlettePath = component "path-resolver.ts::resolvearchlettepath" {
                    description "Core path resolver honoring Archlette rules (no file existence checks).\n- \"~\"  -> user home\n- \"/\"  -> absolute\n- else -> relative to CLI dir"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveModuleEntry = component "path-resolver.ts::resolvemoduleentry" {
                    description "Resolve a module entry by probing:\n1) Exact path\n2) With extensions: .ts then .js\n3) If directory: index.ts then index.js"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_toFileUrl = component "path-resolver.ts::tofileurl" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_writeFile = component "path-resolver.ts::writefile" {
                    description "Write content to a file, creating parent directories if needed."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadExtractorModule = component "stage-module-loader.ts::loadextractormodule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadValidatorModule = component "stage-module-loader.ts::loadvalidatormodule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadGeneratorModule = component "stage-module-loader.ts::loadgeneratormodule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadRendererModule = component "stage-module-loader.ts::loadrenderermodule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_getCacheDir = component "tool-manager.ts::getcachedir" {
                    description "Get the Archlette cache directory"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_ensureCacheDir = component "tool-manager.ts::ensurecachedir" {
                    description "Ensure cache directory exists"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_commandExistsInPath = component "tool-manager.ts::commandexistsinpath" {
                    description "Check if a command exists in PATH"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadFile = component "tool-manager.ts::downloadfile" {
                    description "Download a file from URL to destination"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_extractZip = component "tool-manager.ts::extractzip" {
                    description "Extract a ZIP file (simple extraction for Structurizr CLI)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_makeExecutable = component "tool-manager.ts::makeexecutable" {
                    description "Make file executable (Unix only)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadStructurizr = component "tool-manager.ts::downloadstructurizr" {
                    description "Download and install Structurizr CLI to cache"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadPlantUML = component "tool-manager.ts::downloadplantuml" {
                    description "Download and install PlantUML to cache"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_findStructurizrCLI = component "tool-manager.ts::findstructurizrcli" {
                    description "Find or download Structurizr CLI"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_findPlantUML = component "tool-manager.ts::findplantuml" {
                    description "Find or download PlantUML JAR"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_checkJava = component "tool-manager.ts::checkjava" {
                    description "Verify Java is available"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_tool_manager_ts_requireJava = component "tool-manager.ts::requirejava" {
                    description "Validate Java is installed (throw if not)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_types_aac_ts_resolveConfig = component "types-aac.ts::resolveconfig" {
                    description "For each stage, resolve includes/excludes for each node:\n  - If node omits includes/excludes, inherit from defaults."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_extractors_builtin_basic_node_ts_basicNodeExtractor = component "basic-node.ts::basicnodeextractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_structurizrGenerator = component "structurizr.ts::structurizrgenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateAllActorRelationships = component "structurizr.ts::generateallactorrelationships" {
                    description "Generate all actor-related relationships (bidirectional)\n\nIncludes:\n1. Actor → Component (from actor.targets) - users interacting with system\n2. Component → Actor (from componentRelationships) - system using external actors\n\nStructurizr automatically aggregates relationships in views:\n- System Context view: Shows as actor ↔ system\n- Container view: Shows as actor ↔ container\n- Component view: Shows actual actor ↔ component relationships"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateModel = component "structurizr.ts::generatemodel" {
                    description "Generate the model section of the DSL"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateViews = component "structurizr.ts::generateviews" {
                    description "Generate the views section of the DSL"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateSystemContextView = component "structurizr.ts::generatesystemcontextview" {
                    description "Generate System Context view\n\nShows actors and the system boundary. Structurizr automatically aggregates\nactor → component relationships to actor → system for this view since\ncomponents are not explicitly included."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainerView = component "structurizr.ts::generatecontainerview" {
                    description "Generate Container view\n\nShows actors, containers, and their relationships. Actor → component\nrelationships are automatically aggregated to actor → container level\nby Structurizr since components are not shown in this view."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponentView = component "structurizr.ts::generatecomponentview" {
                    description "Generate Component view for a container (excludes Code elements)\n\nShows actors, components within the container, and their relationships.\nActor → component relationships are shown explicitly at this level.\nCode elements are excluded to keep the view focused on architecture."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateClassView = component "structurizr.ts::generateclassview" {
                    description "Generate Class view for a component (only Code elements within that component)\nThis supports the drill-down model: System → Container → Component → Code\n\nNote: Component views in Structurizr require a container ID, not a component ID.\nWe use the component's container and filter to show only this component's code."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateActor = component "structurizr.ts::generateactor" {
                    description "Generate DSL for an actor (person or external system)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainer = component "structurizr.ts::generatecontainer" {
                    description "Generate DSL for a container with its components"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponent = component "structurizr.ts::generatecomponent" {
                    description "Generate DSL for a component"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateCodeAsComponent = component "structurizr.ts::generatecodeascomponent" {
                    description "Generate DSL for a code item as a component\nAlways tagged with \"Code\" to separate from logical components in views"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateUniqueCodeName = component "structurizr.ts::generateuniquecodename" {
                    description "Generate a unique name for a code item to avoid naming collisions\n\nExtracts file context from the code ID to create a unique display name.\nExample: \"1-extract/index.ts::run\" or \"cli.ts::run\""
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateRelationship = component "structurizr.ts::generaterelationship" {
                    description "Generate DSL for a relationship"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_buildTechnologyString = component "structurizr.ts::buildtechnologystring" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateDeployment = component "structurizr.ts::generatedeployment" {
                    description "Generate DSL for a deployment environment"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_sanitizeId = component "structurizr.ts::sanitizeid" {
                    description "Sanitize ID for DSL (remove special characters, convert to camelCase)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_escapeString = component "structurizr.ts::escapestring" {
                    description "Escape special characters in strings for DSL"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_renderers_builtin_plantuml_render_ts_plantumlRender = component "plantuml-render.ts::plantumlrender" {
                    description "Render PlantUML files to PNG images"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_renderers_builtin_structurizr_export_ts_structurizrExport = component "structurizr-export.ts::structurizrexport" {
                    description "Export Structurizr DSL to PlantUML and Mermaid formats"
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                cli -> extractors "Analyzes source code to extract architecture components"
                cli -> validators "Validates and enriches intermediate representation"
                cli -> generators "Transforms IR into DSL formats"
                cli -> renderers "Converts DSL to visual diagrams"
            }

        }

        # Actor interactions
        user -> cli "Interacts with CLI"
        cli -> filesystem "Reads configuration and writes output files"
        cli -> filesystem "For reading configuration files and writing output"
        extractors -> filesystem "For reading source code files"
        generators -> filesystem "For writing DSL files"
        renderers -> filesystem "For writing diagram files"

    }

    views {

        systemContext _chrislyons_dev_archlette "SystemContext" {
            include user
            include filesystem
            include _chrislyons_dev_archlette
            autoLayout
        }

        container _chrislyons_dev_archlette "Containers" {
            include user
            include filesystem
            include default_container
            autoLayout
        }

        component default_container "Components__chrislyons_dev_archlette" {
            include user
            include cli
            include extractors
            include validators
            include generators
            include renderers
            include docs
            include core
            exclude "element.tag==Code"
            autoLayout
        }

        component default_container "Classes_CLI" {
            include C__Users_chris_git_archlette_src_cli_ts_usageAndExit
            include C__Users_chris_git_archlette_src_cli_ts_parseArgs
            include C__Users_chris_git_archlette_src_cli_ts_stageListFromArg
            include C__Users_chris_git_archlette_src_cli_ts_loadYamlIfExists
            include C__Users_chris_git_archlette_src_cli_ts_run
            autoLayout
        }

        component default_container "Classes_extractors" {
            include C__Users_chris_git_archlette_src_1_extract_aggregator_ts_aggregateIRs
            include C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateById
            include C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateByName
            include C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateRelationships
            include C__Users_chris_git_archlette_src_1_extract_aggregator_ts_createEmptyIR
            include C__Users_chris_git_archlette_src_1_extract_index_ts_run
            include C__Users_chris_git_archlette_src_extractors_builtin_basic_node_ts_basicNodeExtractor
            autoLayout
        }

        component default_container "Classes_validators" {
            include C__Users_chris_git_archlette_src_2_validate_index_ts_run
            autoLayout
        }

        component default_container "Classes_generators" {
            include C__Users_chris_git_archlette_src_3_generate_index_ts_run
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_structurizrGenerator
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateAllActorRelationships
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateModel
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateViews
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateSystemContextView
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainerView
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponentView
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateClassView
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateActor
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainer
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponent
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateCodeAsComponent
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateUniqueCodeName
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateRelationship
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_buildTechnologyString
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateDeployment
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_sanitizeId
            include C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_escapeString
            autoLayout
        }

        component default_container "Classes_renderers" {
            include C__Users_chris_git_archlette_src_4_render_index_ts_run
            include C__Users_chris_git_archlette_src_renderers_builtin_plantuml_render_ts_plantumlRender
            include C__Users_chris_git_archlette_src_renderers_builtin_structurizr_export_ts_structurizrExport
            autoLayout
        }

        component default_container "Classes_docs" {
            include C__Users_chris_git_archlette_src_5_docs_index_ts_run
            autoLayout
        }

        component default_container "Classes_core" {
            include C__Users_chris_git_archlette_src_core_logger_ts_formatTimestamp
            include C__Users_chris_git_archlette_src_core_logger_ts_formatLogMessage
            include C__Users_chris_git_archlette_src_core_logger_ts_createLogger
            include C__Users_chris_git_archlette_src_core_module_loader_ts_loadModuleFromPath
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_getCliDir
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_expandTilde
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveArchlettePath
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveModuleEntry
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_toFileUrl
            include C__Users_chris_git_archlette_src_core_path_resolver_ts_writeFile
            include C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadExtractorModule
            include C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadValidatorModule
            include C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadGeneratorModule
            include C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadRendererModule
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_getCacheDir
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_ensureCacheDir
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_commandExistsInPath
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadFile
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_extractZip
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_makeExecutable
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadStructurizr
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_downloadPlantUML
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_findStructurizrCLI
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_findPlantUML
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_checkJava
            include C__Users_chris_git_archlette_src_core_tool_manager_ts_requireJava
            include C__Users_chris_git_archlette_src_core_types_aac_ts_resolveConfig
            autoLayout
        }

    }

}