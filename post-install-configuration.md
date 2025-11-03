# Post-Installation Configuration

After installing the Claude Code Governance plugin, you need to configure IAM (Identity and Access Management) permissions to enable autonomous workflow orchestration.

## Why This Configuration is Required

This plugin provides **orchestrated workflows** that coordinate multiple skills in sequence:

```
Implementation → Review → Quality Gate → Fix Cycle → Commit
```

Each arrow represents a skill invocation. For example, the `/orchestrate:hex-arc` command may invoke:

- **audit-logger** (7+ times per feature)
- **implementation-engine** (once per layer)
- **review-engine** (once per layer, plus once per fix iteration)
- **quality-gate** (once per layer, plus once per fix iteration)
- **fix-coordinator** (0-3 times per layer if quality gate fails)
- **git-ops** (once per layer)
- **pattern-loader** (multiple times during planning and implementation)

**Without IAM configuration**, Claude Code will prompt you for approval **every single time** a skill is invoked. This would require 20-30+ manual approvals for a simple 2-layer feature implementation, making autonomous orchestration impossible.

## What You Need to Configure

You need to whitelist all skills from this plugin so they can execute without manual approval prompts.

## Configuration Steps

**Step 1:** Open your Claude Code settings file:

```bash
# macOS/Linux
nano ~/.claude/settings.json

# Windows
notepad %USERPROFILE%\.claude\settings.json
```

**Step 2:** Add the `iam` section with an allow rule:

```json
{
  "enabledPlugins": {
    "claude-code-governance@architecture-governance-patterns": true
  },
  "iam": {
    "allow": [
      "Skill(claude-code-governance:*)"
    ]
  }
}
```

**Important:** If you already have an `iam` section, just add the new rule to the existing `allow` array:

```json
{
  "iam": {
    "allow": [
      "Bash(npm test)",
      "Skill(claude-code-governance:*)"  // Add this line
    ]
  }
}
```

**Step 3:** Restart Claude Code for changes to take effect.

## What This Configuration Does

The allow rule `Skill(claude-code-governance:*)` grants permission to all skills from this plugin:

- ✅ **audit-logger** - Logs orchestration activities with timestamps
- ✅ **implementation-engine** - Implements layers following governance patterns
- ✅ **review-engine** - Reviews code using LLM-as-judge
- ✅ **quality-gate** - Makes pass/fail decisions based on review scores
- ✅ **fix-coordinator** - Manages fix cycles for quality gate failures
- ✅ **git-ops** - Creates git commits with quality metrics
- ✅ **pattern-loader** - Loads governance patterns and calibrations

**Security Note:** The wildcard `*` only applies to skills within the `claude-code-governance` namespace. Skills from other plugins are not affected.

## Verifying Configuration

After configuration, test that skills run without prompts:

```bash
# This should execute without approval prompts
/orchestrate:hex-arc test-feature
```

If you still see approval prompts for skills, check:

1. ✅ Settings file syntax is valid JSON
2. ✅ Plugin name matches exactly: `claude-code-governance`
3. ✅ You've restarted Claude Code after configuration
4. ✅ No conflicting deny rules exist in your IAM settings

## Alternative: Granular Permissions

If you prefer to approve individual skills instead of all at once, you can whitelist them individually:

```json
{
  "iam": {
    "allow": [
      "Skill(claude-code-governance:audit-logger)",
      "Skill(claude-code-governance:implementation-engine)",
      "Skill(claude-code-governance:review-engine)",
      "Skill(claude-code-governance:quality-gate)",
      "Skill(claude-code-governance:fix-coordinator)",
      "Skill(claude-code-governance:git-ops)",
      "Skill(claude-code-governance:pattern-loader)"
    ]
  }
}
```

**Note:** This approach requires updating the list whenever new skills are added to the plugin.

## Troubleshooting

### Still seeing approval prompts?

**Check 1: Verify plugin is enabled**
```bash
# In Claude Code
/help
# Look for claude-code-governance commands in the output
```

**Check 2: Check for deny rules**

Deny rules take precedence over allow rules. If you have:

```json
{
  "iam": {
    "deny": ["Skill(*)"],  // This blocks ALL skills
    "allow": ["Skill(claude-code-governance:*)"]
  }
}
```

The deny rule will win. Remove conflicting deny rules.

**Check 3: Validate JSON syntax**

Invalid JSON will cause settings to be ignored:

```bash
# Validate your settings file
cat ~/.claude/settings.json | jq .
```

If you see errors, fix the JSON syntax.

### Want to revoke permissions later?

Simply remove the allow rule from your settings file and restart Claude Code.

## Security Considerations

### Is it safe to whitelist plugin skills?

**Yes, for this plugin**, because:

1. **Tool restrictions**: Each skill has `allowed-tools` restrictions
   - `audit-logger`: Can only Read, Write, and run Bash
   - `review-engine`: Can only Read (no file modifications)
   - `implementation-engine`: Limited to safe file operations

2. **Transparency**: All skill actions are logged in the audit trail at `docs/{feature}/implementation-audit.md`

3. **No external network access**: Skills operate on local files only

4. **Open source**: You can review all skill prompts in the `skills/` directory

### General IAM Best Practices

- ✅ Only whitelist plugins you trust
- ✅ Review skill definitions before whitelisting (check `skills/*/SKILL.md`)
- ✅ Use specific rules over wildcards when possible
- ✅ Regularly audit your `~/.claude/settings.json` for unused rules
- ✅ Remove plugins you no longer use

## More Information

- [Claude Code IAM Documentation](https://docs.claude.com/en/docs/claude-code/iam.md)
- [Skills Guide](https://docs.claude.com/en/docs/claude-code/skills.md)

## Questions or Issues?

If you encounter problems with IAM configuration:

1. Check the troubleshooting section above
2. Review your settings file for syntax errors
3. Consult the [Claude Code IAM docs](https://docs.claude.com/en/docs/claude-code/iam.md)
4. File an issue in the plugin repository with:
   - Your `~/.claude/settings.json` (redact sensitive information)
   - Error messages or screenshots
   - Steps to reproduce
