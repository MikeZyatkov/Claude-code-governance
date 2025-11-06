---
name: jira-requirements
description: Creates well-structured Jira tickets focusing on business value and WHAT needs to be built from end-user perspective. Includes user story, value, context, business requirements, acceptance criteria (Gherkin), definition of done (outcomes), and high-level technical guidance. Avoids implementation details like specific files, classes, or step-by-step instructions.
allowed-tools: mcp__atlassian__*, Read, Grep, Bash
---

# Jira Requirements Skill

Creates well-structured Jira tickets focusing on business value and WHAT needs to be built from the end-user perspective, avoiding implementation details.

## Purpose

Automates the creation of high-quality Jira tickets using the standard template:
- **User Story** (As a... I want to... So that...)
- **Value** - Business value and why this matters
- **Context & Background** - Current state and capability gaps
- **Business Requirements** - Numbered list of requirements
- **Acceptance Criteria** - Gherkin scenarios (Given/When/Then)
- **Definition of Done** - Checkboxes with outcomes and quality gates (NOT implementation tasks)
- **Technical consideration** (optional) - High-level architectural guidance (NOT detailed implementation)

## When to Use

- When creating new features or user stories
- For documenting requirements from specs, meetings, or discussions
- When you have a requirements document that needs to be converted to a Jira ticket
- When you need to create well-structured tickets interactively

## How It Works

### Hybrid Approach

**Two input methods supported:**

1. **Document-Based (Recommended for complex features):**
   - User provides a markdown file with requirements (structured or free-form)
   - Skill reads the file, extracts information, asks clarifying questions
   - Shows formatted preview following the template
   - User confirms, then creates ticket

2. **Conversational (Good for quick tickets):**
   - User describes requirements in conversation
   - Skill asks targeted questions to fill out template sections
   - Shows formatted preview
   - User confirms, then creates ticket

### Template Structure

The Jira ticket description follows this exact format:

```markdown
**As a** {user role}
**I want to** {capability}
**So that** {business benefit}

---

## Value

{Explanation of business value - why this is important, what problem it solves, what happens without it}

---

## Context & Background

**Current State:**
- {What exists today}
- {What doesn't exist}
- {Where the code lives}

**{Domain-Specific Details}:**
- {Relevant fields/entities}
- {Technical context}

**What Can Be {Action}:**
- {Scope of the work}

---

## Business Requirements

1. {Requirement 1}
2. {Requirement 2}
3. {Requirement 3}
...

---

## Acceptance Criteria

### Scenario: {Scenario name}

```gherkin
Given {precondition}
And {additional context}
When {action}
Then {expected outcome}
And {additional validation}
```

### Scenario: {Another scenario}

```gherkin
Given {precondition}
When {action}
Then {expected outcome}
```

{Repeat for all key scenarios}

---

## Definition of Done

* [ ] {Task 1}
* [ ] {Task 2}
* [ ] {Task 3}
* [ ] Unit tests cover all scenarios
* [ ] {Other completion criteria}

### Technical consideration

{Optional: Implementation details, patterns to follow, conversions needed, etc.}

---
```

### Workflow

#### 1. Determine Input Method

**Ask User:**
- "Do you have a requirements document/file I should read, or would you like to describe the requirements conversationally?"

**If Document:**
- Ask for file path
- Read the file
- Extract information into template sections
- Ask clarifying questions for missing sections

**If Conversational:**
- Guide through each template section
- Ask targeted questions
- Build up the ticket structure

#### 2. Validate Jira Connection

**Steps:**
1. Get Jira cloud ID from user (or site URL)
2. Validate connectivity using `mcp__atlassian__atlassianUserInfo`
3. Get visible projects using `mcp__atlassian__getVisibleJiraProjects`
4. Confirm project key with user
5. Get issue types for project using `mcp__atlassian__getJiraProjectIssueTypesMetadata`

#### 3. Gather Template Information

**For Each Section:**

**User Story:**
- Who is the user/role?
- What capability do they need?
- What's the business benefit?

**Value:**
- Why is this important?
- What problem does it solve?
- What happens without this feature?

**Context & Background:**
- What's the current state?
- What capabilities exist/don't exist?
- Where does relevant code live? (general location, not specific files)
- What are the technical details (fields, entities, integrations)?
- AVOID: Listing specific files to create or detailed implementation steps
- FOCUS ON: Current capabilities and gaps, not prescriptive "what needs to be built"

**Business Requirements:**
- What are the functional requirements? (numbered list)
- What constraints exist?
- What validations are needed?

**Acceptance Criteria:**
- What are the key scenarios to test?
- For each scenario: Given/When/Then in Gherkin format
- Cover happy paths and error cases

**Definition of Done:**
- What business capabilities must be delivered?
- What quality outcomes are expected? (tests pass, linting passes, etc.)
- What functional verification is needed?
- AVOID: Specific file names, class names, or implementation tasks
- FOCUS ON: What works, not how it's built

**Technical Consideration (optional):**
- High-level architectural patterns to follow
- Important constraints or technical context
- Key integrations or dependencies
- AVOID: Detailed code references, file paths, line numbers, method signatures
- FOCUS ON: Strategic technical guidance, not tactical implementation steps

#### 4. Show Preview

**Display formatted ticket:**
- Show complete description with all sections
- Show summary/title
- Show metadata (project, issue type, labels, etc.)
- Ask user: "Does this look correct? Should I create this ticket?"

**User can:**
- Confirm and create
- Request changes to specific sections
- Cancel

#### 5. Create the Ticket

**Steps:**
1. Format description using the template
2. Create issue using `mcp__atlassian__createJiraIssue`:
   - Set `summary` (title)
   - Set `body` (description in markdown)
   - Set `projectKey`
   - Set `issueTypeName` (Story/Task/etc.)
   - Set `parent` if this is a sub-story of an Epic
3. Capture the created issue key and URL
4. Return confirmation with link

#### 6. Confirm Creation

**Display:**
- Issue key (e.g., SSP-12345)
- Issue URL
- Brief summary of what was created

**Optional Follow-ups:**
- Ask if user wants to link this to an Epic
- Ask if user wants to add labels
- Ask if user wants to assign it to someone

## Instructions for Claude

**CRITICAL PRINCIPLE: Focus on WHAT and WHY, not HOW**

The purpose of a Jira ticket is to communicate WHAT needs to be built from the business/user perspective and WHY it's valuable - NOT HOW to implement it. The development team will decide the implementation approach.

- ✅ DO: Describe capabilities, outcomes, business requirements, validation rules
- ✅ DO: Provide high-level technical context and architectural guidance
- ❌ DON'T: List specific files to create, class names, method signatures
- ❌ DON'T: Prescribe step-by-step implementation instructions
- ❌ DON'T: Include detailed code references or line numbers

See the "Examples: Good vs Bad Approaches" section below for concrete examples.

### Starting the Workflow

**First, determine input method:**
1. Ask: "Do you have a requirements document/file I should read, or would you like to describe the requirements conversationally?"
2. If user mentions a file path, use document-based approach
3. If user wants to describe, use conversational approach

### Document-Based Approach

**Steps:**
1. Read the provided file using the Read tool
2. Analyze the content and extract:
   - User story elements (who, what, why)
   - Business value
   - Technical context
   - Requirements (functional and non-functional)
   - Success criteria
3. Map the content to template sections
4. Identify missing information
5. Ask targeted questions to fill gaps
6. Show preview before creating

**Example:**
```
User: "Read requirements from docs/features/contract-update.md"
Claude: [Reads file]
        I've extracted the following from the document:
        - User Story: As an operator admin, I want to update contracts...
        - Value: Allows contract modifications without recreation...

        I need a few clarifications:
        - What are the key validation scenarios for acceptance criteria?
        - Are there any technical considerations (patterns, conversions)?
```

### Conversational Approach

**Initial Request - Ask ONE open question:**

"Please describe what needs to be built from a business/user perspective. To create a comprehensive ticket, try to mention:
- **Who** needs this (user role)
- **What** they need to do (capability/feature)
- **Why** it's important (business value, problem it solves)
- **Current state** (what capabilities exist/don't exist today)
- **Requirements** (what must the solution do?)
- **Validations** (what should be validated/prevented?)
- **Technical context** (high-level patterns, general code location, key constraints)

Focus on WHAT needs to work and WHY, not HOW to implement it. Avoid listing specific files to create or detailed implementation steps.

Don't worry if you don't have all details - I'll extract what I can and ask follow-up questions for anything critical that's missing."

**Extract and Infer:**
- Parse their description intelligently
- Map natural language to template sections
- Fill out as much of the template as possible
- Make reasonable inferences for missing details
- Draft initial acceptance criteria based on requirements

**Targeted Follow-ups (only if needed):**
- If acceptance criteria scenarios are unclear, ask for key test scenarios
- If critical validations are missing, ask specifically
- If technical considerations would be helpful, prompt for them

**Show Preview:**
- Display complete formatted ticket with all sections
- Ask: "Does this look correct? Any changes needed?"
- Make adjustments if requested
- Confirm before creating

**Original step-by-step approach (fallback if user prefers):**

1. **User Story:**
   ```
   Ask: "Who is the user/role for this feature?"
   Ask: "What capability do they need?"
   Ask: "What's the business benefit?"
   Format: **As a** {role} **I want to** {capability} **So that** {benefit}
   ```

2. **Value:**
   ```
   Ask: "Why is this important to the business?"
   Ask: "What problem does it solve?"
   Ask: "What happens if we don't build this?"
   ```

3. **Context & Background:**
   ```
   Ask: "What's the current state? What capabilities exist/don't exist?"
   Ask: "Where does relevant code live?" (general location only)
   Ask: "Any technical details (fields, entities, integrations) to mention?"
   Avoid listing specific files to create or prescribing implementation
   Focus on describing current state and gaps, not "what needs to be built"
   ```

4. **Business Requirements:**
   ```
   Ask: "What are the functional requirements?"
   Build numbered list
   Confirm completeness
   ```

5. **Acceptance Criteria:**
   ```
   Ask: "What are the key scenarios to test?"
   For each scenario:
     Ask: "What's the precondition (Given)?"
     Ask: "What action happens (When)?"
     Ask: "What's the expected result (Then)?"
   Format as Gherkin scenarios
   ```

6. **Definition of Done:**
   ```
   Ask: "What capabilities or outcomes must be delivered?"
   Ask: "What quality gates must pass? (tests, linting, type checking)"
   Build checkbox list focusing on WHAT works, not HOW it's built
   Avoid listing specific file names or implementation tasks
   ```

7. **Technical Consideration (optional):**
   ```
   Ask: "Any high-level architectural patterns or technical constraints to note?"
   Focus on strategic guidance (e.g., "Follow DDD patterns", "Skip Bluefin for ELUMO_ONLY")
   Avoid detailed code references, file paths, or line-by-line instructions
   ```

### Formatting the Ticket

**Strict Template Format:**
- Use the EXACT template structure shown above
- Use `---` horizontal rules between major sections
- Use `**bold**` for user story keywords (As a, I want to, So that)
- Use `##` for section headers
- Use `###` for scenario names
- Use backtick code blocks with `gherkin` language for scenarios
- Use `* [ ]` for Definition of Done checkboxes
- Use numbered lists for Business Requirements

**CRITICAL - Gherkin Formatting:**
- MUST use proper markdown code blocks:
  ```
  ### Scenario: Name here

  ```gherkin
  Given some precondition
  When some action
  Then some result
  ```
  ```
- DO NOT use inline code or single-line gherkin blocks
- Each scenario needs its own code block
- Use proper Given/When/Then keywords

**Keep It Concise:**
- Value section: 2-4 sentences max
- Context & Background: Brief bullets, not essays
- Business Requirements: 5-10 items max, not 20+
- Acceptance Criteria: 3-7 key scenarios (not every edge case)
- Definition of Done: 8-12 items max
- Technical consideration: 2-3 sentences or short bullets

**Avoid Redundancy:**
- Don't repeat the same information in multiple sections
- Don't include extensive comparison tables unless critical
- Don't add "Out of Scope" or "Size & Complexity" sections
- Keep technical specs brief - detailed design belongs in separate docs

**Example of properly formatted description:**
```markdown
**As an** operator administrator
**I want to** update contract details (start date, end date)
**So that** contract terms can be adjusted as business arrangements change

---

## Value

Business circumstances change - contract dates may need adjustment...

---

## Context & Background

**Current State:**
- Contract creation exists
- NO update method exists

**Contract Fields:**
- startDate: Contract start date
- endDate: Contract end date (null for rolling)
...
```

### Validation and Preview

**Before Creating:**
1. Validate all required sections are present:
   - User Story (must have)
   - Value (must have)
   - Context & Background (must have)
   - Business Requirements (must have)
   - Acceptance Criteria (must have, at least 2 scenarios)
   - Definition of Done (must have)
   - Technical consideration (optional)

2. Show complete formatted preview
3. Display metadata:
   - Project: {key}
   - Issue Type: {type}
   - Summary: {title}
4. Ask: "Does this look correct? Should I create this ticket?"
5. Wait for confirmation

**If user wants changes:**
- Ask which section to modify
- Make changes
- Show updated preview
- Confirm again

### Jira Connection

**Getting Cloud ID:**
1. Ask user for Jira site (e.g., "essensys.atlassian.net")
2. Use `mcp__atlassian__getAccessibleAtlassianResources` to get cloud ID
3. Or accept cloud ID directly if user provides UUID

**Getting Project:**
1. Use `mcp__atlassian__getVisibleJiraProjects` with action="create"
2. Show user the available projects
3. Ask which project to use
4. Confirm project key

**Getting Issue Type:**
1. Use `mcp__atlassian__getJiraProjectIssueTypesMetadata`
2. Show available types (Story, Task, Bug, etc.)
3. Default to "Story" for most features
4. Ask user to confirm

### Creating the Issue

**Use mcp__atlassian__createJiraIssue:**
```javascript
{
  cloudId: "{cloud-id or site URL}",
  projectKey: "{project-key}",
  issueTypeName: "Story",
  summary: "{concise title}",
  body: "{formatted description following template}",
  parent: "{epic-key-if-applicable}"
}
```

**Important:**
- Use markdown for the body
- Ensure the template formatting is preserved
- Don't add extra formatting not in the template

### Error Handling

**Project Not Found:**
- Use `mcp__atlassian__getVisibleJiraProjects` to list available projects
- Show user the projects they have access to
- Ask which project to use

**Permission Denied:**
- Confirm user has create permission in the project
- Use `action="create"` filter when getting projects
- Suggest alternative project if needed

**Invalid Issue Type:**
- Use `mcp__atlassian__getJiraProjectIssueTypesMetadata` to get valid types
- Show available types to user
- Default to "Story" for features

**Missing Sections:**
- If user skips a section, ask specifically for it
- Explain why each section is important
- Don't create ticket with incomplete template

## Example Workflow: Document-Based

**User:**
"Read the requirements from docs/contract-update.md and create a Jira ticket"

**Actions:**

1. **Read Document:**
   ```
   Read docs/contract-update.md
   Extract: User wants to update contract dates
   Extract: Business value about avoiding recreation
   Extract: Technical details about validation
   ```

2. **Map to Template:**
   ```
   User Story: As an operator admin, I want to update contract dates, so that...
   Value: [extracted from doc]
   Context: [extracted from doc]
   Business Requirements: [extracted from doc]
   Gaps: Need acceptance criteria scenarios
   ```

3. **Fill Gaps:**
   ```
   Ask: "I see requirements for date validation. What are the key test scenarios?"
   User provides scenarios
   Format as Gherkin
   ```

4. **Show Preview:**
   ```
   Here's the formatted ticket:

   **Summary:** Update Contract Details

   **Description:**
   **As an** operator administrator
   **I want to** update contract details (start date, end date)
   **So that** contract terms can be adjusted as business arrangements change

   ---

   ## Value
   Business circumstances change - contract start dates may need...
   [... full preview ...]

   Does this look correct? Should I create this ticket?
   ```

5. **Create Ticket:**
   ```
   User: "Yes, create it in project SSP"
   Validate: Get SSP project
   Validate: Check issue types
   Create: mcp__atlassian__createJiraIssue
   Return: "Created SSP-20351: https://essensys.atlassian.net/browse/SSP-20351"
   ```

## Example Workflow: Conversational

**User:**
"Create a Jira ticket for user authentication"

**Actions:**

1. **Determine Method:**
   ```
   Ask: "Do you have a requirements document/file I should read, or would you like to describe conversationally?"
   User: "I'll describe it"
   ```

2. **User Story:**
   ```
   Ask: "Who is the user/role for this feature?"
   User: "System users"
   Ask: "What capability do they need?"
   User: "To authenticate and access the system"
   Ask: "What's the business benefit?"
   User: "Secure access control"
   ```

3. **Value:**
   ```
   Ask: "Why is this important to the business?"
   User: "We need to control who can access tenant data"
   Ask: "What happens without it?"
   User: "Anyone could access sensitive data"
   ```

4. **Context & Background:**
   ```
   Ask: "What's the current state?"
   User: "No authentication exists. Code is in /src/auth"
   ```

5. **Business Requirements:**
   ```
   Ask: "What are the functional requirements?"
   User: "JWT auth, role-based access, session management"
   Build list...
   ```

6. **Acceptance Criteria:**
   ```
   Ask: "What are the key scenarios?"
   User: "Login, logout, token validation, expired tokens"
   For each: Ask Given/When/Then
   Format as Gherkin
   ```

7. **Definition of Done:**
   ```
   Ask: "What capabilities or outcomes must be delivered?"
   User: "Authentication working, all tests pass, deployment complete"
   Build checkbox list focusing on outcomes not implementation tasks
   ```

8. **Technical Consideration:**
   ```
   Ask: "Any high-level technical guidance or constraints?"
   User: "Follow existing auth patterns, ensure secure password storage, use session management"
   Keep it high-level, avoid detailed implementation steps
   ```

9. **Preview & Create:**
   ```
   Show formatted preview
   Get confirmation
   Create ticket
   Return link
   ```

## Notes

**Critical Rules:**
- ALWAYS use the exact template format
- ALWAYS show preview before creating
- ALWAYS wait for user confirmation
- NEVER skip template sections (except Technical consideration)
- NEVER create without validation
- NEVER make tickets too long - be concise!

**Template Formatting:**
- Exact structure matters for consistency
- Use markdown properly (bold, headers, code blocks)
- Gherkin scenarios MUST be in proper code blocks:
  ```
  ### Scenario: Title

  ```gherkin
  Given...
  When...
  Then...
  ```
  ```
- NOT inline code like `Given...When...Then...`
- NOT single-line gherkin blocks
- Horizontal rules (`---`) between major sections

**Conciseness Guidelines:**
- Value: 2-4 sentences (not paragraphs)
- Context: Brief bullets describing current state (not detailed essays or file lists)
- Business Requirements: 5-10 clear items (not 20+)
- Acceptance Criteria: 3-7 key scenarios (focus on critical paths)
- Definition of Done: 8-12 items focusing on outcomes (not implementation tasks)
- Technical consideration: 2-3 sentences or short bullets (high-level only)

**Avoid:**
- Long comparison tables
- "Out of Scope" sections (keep tickets focused)
- "Size & Complexity" estimates (not needed in description)
- Extensive technical specifications (link to design docs instead)
- Repeating same information across multiple sections
- **CRITICAL: Listing specific files, classes, or methods to create**
- **CRITICAL: Detailed code references, file paths, or line numbers**
- **CRITICAL: Step-by-step implementation instructions**
- **CRITICAL: Prescriptive "What Needs to Be Built" with implementation details**

**Examples: Good vs Bad Approaches**

❌ **BAD - Definition of Done (too implementation-focused):**
```
* [ ] Create DecommissionOccupierCommand.ts in contexts/tenant-management/application/commands/
* [ ] Create DecommissionOccupierCommandHandler.ts with command handler logic
* [ ] Add decommission() method to Occupier.aggregate.ts with domain validation
* [ ] Create OccupierDecommissioned.ts domain event in contexts/tenant-management/domain/events/
* [ ] Create lambda handler decommission-occupier-handler.ts in contexts/tenant-management/infrastructure/
* [ ] Update OccupierRepository interface to support decommission status updates
```

✅ **GOOD - Definition of Done (outcome-focused):**
```
* [ ] Occupier decommissioning capability implemented for ELUMO_ONLY accounts
* [ ] Decommission status transitions work correctly (null → IN_PROGRESS → DECOMMISSIONED)
* [ ] Contract and occupancy validations prevent invalid decommissioning
* [ ] All acceptance criteria scenarios pass
* [ ] Domain events published for decommission operations
* [ ] Tests pass (npm test)
* [ ] Linting passes (npm run lint)
* [ ] Type checking passes (npm run type-check)
```

❌ **BAD - Technical Consideration (too detailed):**
```
Architecture Pattern:
Follow existing ELUMO_ONLY patterns in contexts/tenant-management/:
- Command: DecommissionOccupierCommand (domain params, camelCase)
- Handler: DecommissionOccupierCommandHandler (orchestration)
- Aggregate: Add decommission() method to Occupier.aggregate.ts
- Event: OccupierDecommissioned (domain event)

API Mapping:
- Request: DecommissionOccupierRequest (snake_case) → DecommissionOccupierParams (camelCase)
- Response: DecommissionOccupierResponse (snake_case)
- Use OccupierApiMapper for conversions

Occupancy Handling (reuse logic):
Reference legacy implementation in services/occupiers/helpers/decommissioning.ts:232-260:
- If start_date >= today: DELETE (emit OccupancyDeleted)
- If start_date < today: END with end_date = yesterday (emit OccupancyEnded)

Repository Method:
Add to IOccupierRepository:
updateDecommissionStatus(occupierId: string, status: DecommissionStatus): Promise<void>
```

✅ **GOOD - Technical Consideration (high-level):**
```
Follow DDD patterns established in contexts/tenant-management/ for ELUMO_ONLY operations.
Skip Bluefin integration checks entirely for ELUMO_ONLY accounts.
No legacy_id requirement for ELUMO_ONLY OSAs.
Handle occupancies similar to legacy: delete future occupancies, end active ones.
Use existing API mapping patterns (snake_case ↔ camelCase).
```

❌ **BAD - Context & Background (prescriptive implementation):**
```
**What Needs to Be Built:**
- New DecommissionOccupierCommand and DecommissionOccupierCommandHandler in contexts/tenant-management
- Domain logic in Occupier.aggregate.ts for decommissioning behavior
- Domain event: OccupierDecommissioned
- Lambda handler to expose decommission endpoint for ELUMO_ONLY accounts
- Infrastructure adapter for persisting decommission status
- Skip all Bluefin-specific checks (provisioning, legacy_id requirements)
```

✅ **GOOD - Context & Background (descriptive current state):**
```
**Current State:**
- Legacy decommissioning exists in services/occupiers/ and requires Bluefin integration
- Legacy flow checks Bluefin service provisioning status and requires legacy_id on OSAs
- ELUMO_ONLY operations (create site, create occupier) already use DDD pattern in contexts/tenant-management/
- No ELUMO_ONLY-specific decommissioning path exists

**ELUMO_ONLY Account Characteristics:**
- account_type === 'ELUMO_ONLY' in authorizer context
- No Bluefin dependencies required
- May not have legacy_id on OSAs
- Simplified validation rules compared to legacy accounts
```

**User Experience:**
- Make it conversational and helpful
- Explain why you need each piece of information
- Offer suggestions when user is unsure
- Show what the final ticket will look like before creating
- Edit ruthlessly for clarity and brevity
