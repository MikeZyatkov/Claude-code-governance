# Jira Ops Plugin

Jira operations automation plugin for Claude Code that streamlines issue management, requirements documentation, and workflow automation.

## Overview

The `jira-ops` plugin provides specialized skills for working with Jira in an intelligent, structured way. It helps create well-documented issues with comprehensive requirements, acceptance criteria, and technical specifications.

## Features

- **Structured Requirements**: Creates Jira tickets with clear problem statements, requirements, and acceptance criteria
- **Technical Specifications**: Includes architecture considerations, dependencies, and implementation notes
- **Best Practices**: Follows industry standards for requirement documentation
- **MCP Integration**: Leverages Atlassian MCP tools for seamless Jira integration

## Installation

1. Copy the `jira-ops` directory to your Claude Code plugins location
2. The plugin will be automatically discovered by Claude Code
3. Ensure you have the Atlassian MCP server configured for Jira access

## Skills

### jira-requirements

Creates well-structured Jira tickets with comprehensive requirements and specifications.

**Usage:**
```
Use the claude-code-governance:jira-requirements skill to create a Jira ticket
```

**What it does:**
- Validates Jira connectivity and permissions
- Gathers requirement details interactively
- Structures the ticket with clear sections:
  - Context and problem statement
  - Functional and non-functional requirements
  - Acceptance criteria (testable)
  - Technical approach and architecture
  - Test scenarios
- Creates the issue with proper metadata and labels
- Links related issues and dependencies

**Example Use Cases:**
- Creating user stories with clear acceptance criteria
- Documenting bug reports with reproduction steps
- Defining technical tasks with implementation specs
- Capturing requirements from meetings or discussions

## Configuration

### Prerequisites

1. **Atlassian MCP Server**: You must have the Atlassian MCP server configured with Jira access
2. **Jira Permissions**: Your Jira user must have create issue permissions in target projects

### MCP Setup

Add the Atlassian MCP server to your Claude Code configuration to enable Jira integration.

## Usage Examples

### Creating a Feature Requirement

```
User: Create a Jira ticket for implementing user authentication

Claude: I'll use the jira-requirements skill to create a comprehensive ticket.
        First, let me validate your Jira access and gather some details...

        [Skill creates structured ticket with requirements, acceptance criteria, etc.]
```

### Creating a Bug Report

```
User: Log a bug about the memory leak in the notification service

Claude: I'll create a detailed bug ticket. Let me gather information about
        the issue, reproduction steps, and expected behavior...
```

## Roadmap

Future skills planned for the `jira-ops` plugin:

- **jira-sprint-planning**: Sprint planning and backlog management
- **jira-issue-linking**: Automated issue relationship management
- **jira-workflow**: Custom workflow automation and transitions
- **jira-reporting**: Generate reports and metrics from Jira data
- **jira-bulk-ops**: Bulk operations on multiple issues

## Contributing

This plugin follows the same patterns as the `claude-code-governance` plugin:
- Each skill has a `SKILL.md` with frontmatter and detailed instructions
- Skills are autonomous and focused on specific tasks
- Documentation includes clear examples and error handling

## License

Same license as the parent repository.

## Author

Mikhail
