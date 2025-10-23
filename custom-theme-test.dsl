/**
 * Custom Test Theme - Dark Mode
 */

theme default

// Element styles
styles {
    // Dark theme colors
    element "Person" {
        background #2c3e50
        color #ecf0f1
        shape Person
        fontSize 22
    }

    element "Software System" {
        background #34495e
        color #ecf0f1
        shape RoundedBox
        fontSize 24
    }

    element "Container" {
        background #7f8c8d
        color #ffffff
        shape RoundedBox
        fontSize 20
    }

    element "Component" {
        background #95a5a6
        color #2c3e50
        shape RoundedBox
        fontSize 18
    }

    element "External" {
        background #c0392b
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    // Relationship styles
    relationship "Relationship" {
        color #bdc3c7
        dashed false
        routing Curved
        fontSize 12
        thickness 2
    }
}
