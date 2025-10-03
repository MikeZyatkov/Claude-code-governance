/**
 * Pattern loader - loads patterns from YAML files
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { Pattern } from './types'

export class PatternLoader {
  private patternsDir: string

  constructor(patternsDir?: string) {
    this.patternsDir = patternsDir || path.join(__dirname, '../../patterns')
  }

  /**
   * Load a specific pattern by category and name
   */
  loadPattern(category: string, name: string, version: string = 'v1'): Pattern {
    const patternPath = path.join(
      this.patternsDir,
      category,
      name,
      `${version}.yaml`
    )

    if (!fs.existsSync(patternPath)) {
      throw new Error(`Pattern not found: ${patternPath}`)
    }

    const content = fs.readFileSync(patternPath, 'utf8')
    const pattern = yaml.parse(content) as Pattern

    this.validatePattern(pattern)

    return pattern
  }

  /**
   * Load all patterns in a category
   */
  loadCategoryPatterns(category: string): Pattern[] {
    const categoryPath = path.join(this.patternsDir, category)

    if (!fs.existsSync(categoryPath)) {
      throw new Error(`Pattern category not found: ${category}`)
    }

    const patterns: Pattern[] = []
    const patternDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const patternDir of patternDirs) {
      const patternPath = path.join(categoryPath, patternDir)
      const versions = fs.readdirSync(patternPath)
        .filter(file => file.endsWith('.yaml'))
        .sort()
        .reverse() // Latest version first

      if (versions.length > 0) {
        const latestVersion = versions[0]
        const pattern = this.loadPattern(
          category,
          patternDir,
          latestVersion.replace('.yaml', '')
        )
        patterns.push(pattern)
      }
    }

    return patterns
  }

  /**
   * Load all available patterns
   */
  loadAllPatterns(): Pattern[] {
    const categories = ['core', 'domain', 'application', 'infrastructure']
    const allPatterns: Pattern[] = []

    for (const category of categories) {
      try {
        const patterns = this.loadCategoryPatterns(category)
        allPatterns.push(...patterns)
      } catch (error) {
        // Category might not exist yet, skip
        console.warn(`Skipping category ${category}: ${error}`)
      }
    }

    return allPatterns
  }

  /**
   * List all available patterns
   */
  listPatterns(): Array<{ category: string; name: string; versions: string[] }> {
    const categories = ['core', 'domain', 'application', 'infrastructure']
    const patternList: Array<{ category: string; name: string; versions: string[] }> = []

    for (const category of categories) {
      const categoryPath = path.join(this.patternsDir, category)

      if (!fs.existsSync(categoryPath)) {
        continue
      }

      const patternDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      for (const patternDir of patternDirs) {
        const patternPath = path.join(categoryPath, patternDir)
        const versions = fs.readdirSync(patternPath)
          .filter(file => file.endsWith('.yaml'))
          .map(file => file.replace('.yaml', ''))
          .sort()

        patternList.push({
          category,
          name: patternDir,
          versions
        })
      }
    }

    return patternList
  }

  private validatePattern(pattern: Pattern): void {
    const required = ['pattern_name', 'version', 'goal', 'guiding_policy', 'tactics', 'constraints']

    for (const field of required) {
      if (!(field in pattern)) {
        throw new Error(`Pattern missing required field: ${field}`)
      }
    }

    // Validate tactics
    for (const tactic of pattern.tactics) {
      if (!tactic.name || !tactic.priority || !tactic.scoring_rubric) {
        throw new Error(`Invalid tactic in pattern ${pattern.pattern_name}: ${JSON.stringify(tactic)}`)
      }

      const validPriorities = ['critical', 'important', 'optional']
      if (!validPriorities.includes(tactic.priority)) {
        throw new Error(`Invalid priority "${tactic.priority}" in tactic ${tactic.name}`)
      }

      // Validate scoring rubric has all scores
      const requiredScores = ['0', '1', '2', '3', '4', '5']
      for (const score of requiredScores) {
        if (!(score in tactic.scoring_rubric)) {
          throw new Error(`Tactic ${tactic.name} missing score ${score} in rubric`)
        }
      }
    }

    // Validate constraints
    for (const constraint of pattern.constraints) {
      if (!constraint.rule || !constraint.evaluation) {
        throw new Error(`Invalid constraint in pattern ${pattern.pattern_name}`)
      }

      const validEvaluations = ['deterministic', 'llm_judge']
      if (!validEvaluations.includes(constraint.evaluation)) {
        throw new Error(`Invalid evaluation type "${constraint.evaluation}" in constraint`)
      }
    }
  }
}

/**
 * Convenience functions
 */
export function loadPattern(category: string, name: string, version?: string): Pattern {
  const loader = new PatternLoader()
  return loader.loadPattern(category, name, version)
}

export function loadAllPatterns(): Pattern[] {
  const loader = new PatternLoader()
  return loader.loadAllPatterns()
}

export function listPatterns(): Array<{ category: string; name: string; versions: string[] }> {
  const loader = new PatternLoader()
  return loader.listPatterns()
}
