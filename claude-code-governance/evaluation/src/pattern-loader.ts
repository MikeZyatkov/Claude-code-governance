/**
 * Pattern loader - loads patterns and calibrations from YAML files
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { Pattern, Calibration } from './types'

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

  /**
   * Load calibration file for a pattern
   */
  loadCalibration(patternName: string, version: string = 'v1'): Calibration {
    const calibrationPath = path.join(
      this.patternsDir,
      '../calibration',
      patternName,
      `${version}-scoring.yaml`
    )

    if (!fs.existsSync(calibrationPath)) {
      throw new Error(`Calibration not found: ${calibrationPath}`)
    }

    const content = fs.readFileSync(calibrationPath, 'utf8')
    const calibration = yaml.parse(content) as Calibration

    this.validateCalibration(calibration)

    return calibration
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
      if (!tactic.id || !tactic.name || !tactic.priority) {
        throw new Error(`Invalid tactic in pattern ${pattern.pattern_name}: ${JSON.stringify(tactic)}`)
      }

      const validPriorities = ['critical', 'important', 'optional']
      if (!validPriorities.includes(tactic.priority)) {
        throw new Error(`Invalid priority "${tactic.priority}" in tactic ${tactic.name}`)
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

  private validateCalibration(calibration: Calibration): void {
    if (!calibration.pattern_ref || !calibration.tactic_scoring) {
      throw new Error('Calibration missing required fields')
    }

    // Validate each tactic scoring has all scores
    for (const tacticScore of calibration.tactic_scoring) {
      if (!tacticScore.tactic_id || !tacticScore.scoring_rubric) {
        throw new Error(`Invalid tactic scoring: ${JSON.stringify(tacticScore)}`)
      }

      const requiredScores = ['0', '1', '2', '3', '4', '5']
      for (const score of requiredScores) {
        if (!(score in tacticScore.scoring_rubric)) {
          throw new Error(`Tactic ${tacticScore.tactic_id} missing score ${score} in rubric`)
        }
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

export function loadCalibration(patternName: string, version?: string): Calibration {
  const loader = new PatternLoader()
  return loader.loadCalibration(patternName, version)
}

export function loadAllPatterns(): Pattern[] {
  const loader = new PatternLoader()
  return loader.loadAllPatterns()
}

export function listPatterns(): Array<{ category: string; name: string; versions: string[] }> {
  const loader = new PatternLoader()
  return loader.listPatterns()
}
