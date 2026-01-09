#!/usr/bin/env node
/**
 * File Size Analyzer
 * Finds large files and components that could be optimized
 */

import { readdirSync, statSync, readFileSync } from 'fs'
import { join, extname, relative } from 'path'

const MAX_RECOMMENDED_SIZE = 500 * 1024 // 500KB
const MAX_RECOMMENDED_LINES = 1000

function getAllFiles(dir, fileList = []) {
	const files = readdirSync(dir)
	
	for (const file of files) {
		const filePath = join(dir, file)
		const stat = statSync(filePath)
		
		if (stat.isDirectory()) {
			if (!['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'test-results', 'playwright-report', 'public'].includes(file)) {
				getAllFiles(filePath, fileList)
			}
		} else {
			const ext = extname(file)
			if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
				fileList.push({
					path: filePath,
					size: stat.size,
					ext,
					relativePath: relative(process.cwd(), filePath)
				})
			}
		}
	}
	
	return fileList
}

function countLines(filePath) {
	try {
		const content = readFileSync(filePath, 'utf-8')
		return content.split('\n').length
	} catch {
		return 0
	}
}

console.log('📁 File Size Analysis\n')
console.log('='.repeat(80))

const allFiles = getAllFiles(process.cwd())
console.log(`\n📁 Found ${allFiles.length} source files\n`)

// Analyze by size
const largeFiles = allFiles
	.map(file => ({
		...file,
		lines: countLines(file.path)
	}))
	.filter(file => file.size > MAX_RECOMMENDED_SIZE || file.lines > MAX_RECOMMENDED_LINES)
	.sort((a, b) => b.size - a.size)

console.log(`⚠️  Found ${largeFiles.length} files exceeding recommended size (${MAX_RECOMMENDED_SIZE / 1024}KB) or lines (${MAX_RECOMMENDED_LINES})\n`)

if (largeFiles.length > 0) {
	console.log('📊 Large Files:\n')
	largeFiles.slice(0, 30).forEach(file => {
		const sizeKB = (file.size / 1024).toFixed(2)
		console.log(`   ${file.relativePath}`)
		console.log(`      Size: ${sizeKB}KB | Lines: ${file.lines}`)
		console.log('')
	})
}

// Analyze by directory
console.log('\n📂 Directory Analysis:\n')
const dirSizes = {}

allFiles.forEach(file => {
	const dir = file.relativePath.split('/').slice(0, -1).join('/') || 'root'
	if (!dirSizes[dir]) {
		dirSizes[dir] = { size: 0, count: 0, lines: 0 }
	}
	dirSizes[dir].size += file.size
	dirSizes[dir].count += 1
	dirSizes[dir].lines += file.lines
})

const sortedDirs = Object.entries(dirSizes)
	.map(([dir, stats]) => ({
		dir,
		...stats,
		sizeKB: stats.size / 1024
	}))
	.sort((a, b) => b.size - a.size)

console.log('Top 20 Largest Directories:\n')
sortedDirs.slice(0, 20).forEach(({ dir, sizeKB, count, lines }) => {
	console.log(`   ${dir || 'root'}`)
	console.log(`      ${count} files | ${sizeKB.toFixed(2)}KB | ${lines} lines`)
	console.log('')
})

// Component analysis
console.log('\n🧩 Component Analysis:\n')
const components = allFiles.filter(f => 
	f.relativePath.includes('components/') && 
	(f.ext === '.tsx' || f.ext === '.jsx')
)

const largeComponents = components
	.map(file => ({
		...file,
		lines: countLines(file.path)
	}))
	.filter(file => file.lines > 500)
	.sort((a, b) => b.lines - a.lines)

if (largeComponents.length > 0) {
	console.log(`⚠️  Found ${largeComponents.length} large components (>500 lines):\n`)
	largeComponents.slice(0, 20).forEach(file => {
		console.log(`   ${file.relativePath} (${file.lines} lines)`)
	})
	console.log('\n💡 Consider splitting large components into smaller ones\n')
}

// Library analysis
console.log('\n📚 Library Analysis:\n')
const libFiles = allFiles.filter(f => f.relativePath.startsWith('lib/'))
const libSize = libFiles.reduce((sum, f) => sum + f.size, 0)
const libLines = libFiles.reduce((sum, f) => sum + countLines(f.path), 0)

console.log(`   lib/ directory: ${libFiles.length} files | ${(libSize / 1024).toFixed(2)}KB | ${libLines} lines`)

const largeLibFiles = libFiles
	.map(file => ({
		...file,
		lines: countLines(file.path)
	}))
	.filter(file => file.lines > 500)
	.sort((a, b) => b.lines - a.lines)

if (largeLibFiles.length > 0) {
	console.log(`\n   ⚠️  Large library files (>500 lines):\n`)
	largeLibFiles.slice(0, 10).forEach(file => {
		console.log(`      ${file.relativePath} (${file.lines} lines)`)
	})
}

console.log('\n✅ Analysis complete!')
