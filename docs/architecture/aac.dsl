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
                C__Users_chris_git_archlette_src_cli_ts_usageAndExit = component "usageAndExit" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_parseArgs = component "parseArgs" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_stageListFromArg = component "stageListFromArg" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_loadYamlIfExists = component "loadYamlIfExists" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_cli_ts_run = component "run" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_aggregateIRs = component "aggregateIRs" {
                    description "Aggregate multiple ArchletteIR objects into a single unified IR"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateById = component "deduplicateById" {
                    description "Deduplicate array of entities by their ID field"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateByName = component "deduplicateByName" {
                    description "Deduplicate array of entities by their name field"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_deduplicateRelationships = component "deduplicateRelationships" {
                    description "Deduplicate relationships by source+destination+stereotype combination"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_aggregator_ts_createEmptyIR = component "createEmptyIR" {
                    description "Create an empty but valid ArchletteIR structure"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_1_extract_index_ts_run = component "run" {
                    description "Execute the extraction stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_2_validate_index_ts_run = component "run" {
                    description "Execute the validation stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_3_generate_index_ts_run = component "run" {
                    description "Execute the generation stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_4_render_index_ts_run = component "run" {
                    description "Execute the rendering stage"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_5_docs_index_ts_run = component "run" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_formatTimestamp = component "formatTimestamp" {
                    description "Format timestamp as ISO 8601 (local time)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_formatLogMessage = component "formatLogMessage" {
                    description "Format log message with timestamp, level, and context"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_logger_ts_createLogger = component "createLogger" {
                    description "Create a logger instance"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_module_loader_ts_loadModuleFromPath = component "loadModuleFromPath" {
                    description "Dynamically load an ESM module from a path or module specifier"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_getCliDir = component "getCliDir" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_expandTilde = component "expandTilde" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveArchlettePath = component "resolveArchlettePath" {
                    description "Core path resolver honoring Archlette rules (no file existence checks).\n- \"~\"  -> user home\n- \"/\"  -> absolute\n- else -> relative to CLI dir"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_resolveModuleEntry = component "resolveModuleEntry" {
                    description "Resolve a module entry by probing:\n1) Exact path\n2) With extensions: .ts then .js\n3) If directory: index.ts then index.js"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_toFileUrl = component "toFileUrl" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_path_resolver_ts_writeFile = component "writeFile" {
                    description "Write content to a file, creating parent directories if needed."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadExtractorModule = component "loadExtractorModule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadValidatorModule = component "loadValidatorModule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_stage_module_loader_ts_loadGeneratorModule = component "loadGeneratorModule" {
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_core_types_aac_ts_resolveConfig = component "resolveConfig" {
                    description "For each stage, resolve includes/excludes for each node:\n  - If node omits includes/excludes, inherit from defaults."
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_extractors_builtin_basic_node_ts_basicNodeExtractor = component "basicNodeExtractor" {
                    description "Extract architecture information from a Node.js/TypeScript codebase"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_structurizrGenerator = component "structurizrGenerator" {
                    description "Generate Structurizr DSL from ArchletteIR"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateModel = component "generateModel" {
                    description "Generate the model section of the DSL"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateViews = component "generateViews" {
                    description "Generate the views section of the DSL"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateSystemContextView = component "generateSystemContextView" {
                    description "Generate System Context view"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainerView = component "generateContainerView" {
                    description "Generate Container view"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponentView = component "generateComponentView" {
                    description "Generate Component view for a container (excludes Code elements)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateClassView = component "generateClassView" {
                    description "Generate Class view for a container (only Code elements)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateActor = component "generateActor" {
                    description "Generate DSL for an actor (person or external system)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateContainer = component "generateContainer" {
                    description "Generate DSL for a container with its components"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateComponent = component "generateComponent" {
                    description "Generate DSL for a component"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateCodeAsComponent = component "generateCodeAsComponent" {
                    description "Generate DSL for a code item as a component\nAlways tagged with \"Code\" to separate from logical components in views"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateRelationship = component "generateRelationship" {
                    description "Generate DSL for a relationship"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_buildTechnologyString = component "buildTechnologyString" {
                    description "Build technology string from relationship metadata"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_generateDeployment = component "generateDeployment" {
                    description "Generate DSL for a deployment environment"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_sanitizeId = component "sanitizeId" {
                    description "Sanitize ID for DSL (remove special characters, convert to camelCase)"
                    technology "function"
                    tags "Code"
                }
                C__Users_chris_git_archlette_src_generators_builtin_structurizr_ts_escapeString = component "escapeString" {
                    description "Escape special characters in strings for DSL"
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                cli -> extractors "Analyzes source code to extract architecture components"
                cli -> validators "Validates and enriches intermediate representation"
                cli -> generators "Transforms IR into DSL formats"
                cli -> renderers "Converts DSL to visual diagrams"
                cli -> core "For reading configuration files and writing output"
                extractors -> core "For reading source code files"
                generators -> core "For writing DSL files"
                renderers -> core "For writing diagram files"
            }

        }

    }

    views {

        systemContext _chrislyons_dev_archlette "SystemContext" {
            include *
            autoLayout
        }

        container _chrislyons_dev_archlette "Containers" {
            include *
            autoLayout
        }

        component default_container "Components__chrislyons_dev_archlette" {
            include *
            exclude "element.tag==Code"
            autoLayout
        }

        component default_container "Classes__chrislyons_dev_archlette" {
            include *
            include "element.tag==Code"
            exclude "element.tag!=Code"
            autoLayout
        }

    }

}