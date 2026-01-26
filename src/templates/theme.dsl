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
        width 200
        height 120
        fontSize 14
    }

    // External System styles
    element "External System" {
        background #999999
        color #ffffff
        shape RoundedBox
        width 240
        height 140
        fontSize 14
    }

    element "External" {
        background #999999
        color #ffffff
        shape RoundedBox
        width 240
        height 140
        fontSize 14
    }

    // System styles
    element "Software System" {
        background #1168bd
        color #ffffff
        shape RoundedBox
        width 280
        height 160
        fontSize 16
    }

    // Container styles
    element "Container" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        width 260
        height 150
        fontSize 14
    }

    element "Database" {
        background #438dd5
        color #ffffff
        shape Cylinder
        width 200
        height 140
        fontSize 14
    }

    element "Web Browser" {
        background #438dd5
        color #ffffff
        shape WebBrowser
        width 240
        height 150
        fontSize 14
    }

    element "Mobile App" {
        background #438dd5
        color #ffffff
        shape MobileDevicePortrait
        width 180
        height 200
        fontSize 14
    }

    // Component styles
    element "Component" {
        background #85bbf0
        color #000000
        shape RoundedBox
        width 220
        height 130
        fontSize 12
    }

    // Code element styles (classes, functions, etc.)
    element "Code" {
        background #d4e8fc
        color #000000
        shape RoundedBox
        width 200
        height 100
        fontSize 11
    }

    // Technology-specific styles
    element "Cloudflare Worker" {
        background #f6821f
        color #ffffff
        shape RoundedBox
        width 220
        height 130
        fontSize 12
    }

    element "Service" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        width 220
        height 130
        fontSize 12
    }

    element "API" {
        background #85bbf0
        color #000000
        shape Hexagon
        width 180
        height 120
        fontSize 12
    }

    element "Queue" {
        background #85bbf0
        color #000000
        shape Pipe
        width 200
        height 100
        fontSize 12
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
        width 220
        height 130
        fontSize 12
    }

    element "Message Bus" {
        background #85bbf0
        color #000000
        shape Pipe
        width 200
        height 100
        fontSize 12
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
