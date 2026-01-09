#!/usr/bin/env node
/**
 * Bundle Size Analyzer
 * Analyzes Next.js bundle sizes and identifies large dependencies
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

console.log('📦 Bundle Size Analysis\n')
console.log('='.repeat(80))

// Check if .next exists
if (!existsSync('.next')) {
	console.log('⚠️  .next directory not found. Run "pnpm build" first.\n')
	process.exit(1)
}

try {
	// Analyze bundle
	console.log('\n🔍 Analyzing bundle sizes...\n')
	
	const buildOutput = execSync('pnpm next build 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
	
	// Extract bundle size info from build output
	const bundleMatches = buildOutput.match(/Route \(app\)\s+(\d+)\s+(\d+)\s+(\d+)/g)
	const pageMatches = buildOutput.match(/(\S+)\s+(\d+)\s+(\d+)\s+(\d+)/g)
	
	console.log('📊 Build Output Summary:')
	console.log(buildOutput.split('\n').filter(line => 
		line.includes('Route') || 
		line.includes('○') || 
		line.includes('●') || 
		line.includes('λ') ||
		line.includes('Size') ||
		line.includes('First Load JS')
	).join('\n'))
	
} catch (error) {
	console.error('Error analyzing bundle:', error.message)
}

// Analyze node_modules size
console.log('\n\n📁 Dependency Analysis\n')
console.log('='.repeat(80))

try {
	const duOutput = execSync('du -sh node_modules 2>/dev/null || echo "N/A"', { encoding: 'utf-8' })
	console.log(`Total node_modules size: ${duOutput.trim()}`)
} catch (e) {
	console.log('Could not calculate node_modules size')
}

// List largest packages
console.log('\n🔝 Top 20 Largest Packages:\n')
try {
	const packageSizes = execSync(
		'du -sh node_modules/* 2>/dev/null | sort -hr | head -20',
		{ encoding: 'utf-8' }
	)
	console.log(packageSizes)
} catch (e) {
	console.log('Could not list package sizes')
}

// Count dependencies
console.log('\n📊 Dependency Count:\n')
console.log(`Total dependencies: ${Object.keys(packageJson.dependencies || {}).length}`)
console.log(`Total devDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`)
console.log(`Total packages: ${Object.keys(dependencies).length}`)

console.log('\n✅ Analysis complete!')
console.log('\n💡 Next steps:')
console.log('   1. Run "pnpm analyze:deps" to find unused dependencies')
console.log('   2. Run "pnpm analyze:files" to find large files')
console.log('   3. Check the optimization report')
