#!/usr/bin/env node
/**
 * Dependency Analyzer
 * Finds potentially unused dependencies by analyzing imports
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { execSync } from 'child_process'

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

// Packages that are always used (Next.js, React, etc.)
const alwaysUsed = [
	'next', 'react', 'react-dom', 'typescript', 
	'eslint', '@typescript-eslint', 'tailwindcss',
	'postcss', 'autoprefixer', '@next', 'jest'
]

// Packages that might be imported differently
const specialImports = {
	'@radix-ui/react-icons': '@radix-ui',
	'lucide-react': 'lucide-react',
	'react-icons': 'react-icons',
	'@supabase/ssr': '@supabase',
	'@supabase/supabase-js': '@supabase',
	'supabase': '@supabase',
}

function getAllSourceFiles(dir, fileList = []) {
	const files = readdirSync(dir)
	
	for (const file of files) {
		const filePath = join(dir, file)
		const stat = statSync(filePath)
		
		if (stat.isDirectory()) {
			// Skip certain directories
			if (!['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'test-results', 'playwright-report'].includes(file)) {
				getAllSourceFiles(filePath, fileList)
			}
		} else if (['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(extname(file))) {
			fileList.push(filePath)
		}
	}
	
	return fileList
}

function extractImports(content) {
	const imports = new Set()
	
	// Match various import patterns
	const patterns = [
		/from\s+['"]([^'"]+)['"]/g,
		/require\(['"]([^'"]+)['"]\)/g,
		/import\s+['"]([^'"]+)['"]/g,
	]
	
	for (const pattern of patterns) {
		let match
		while ((match = pattern.exec(content)) !== null) {
			const importPath = match[1]
			
			// Skip relative imports and built-ins
			if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
				// Extract package name (handle scoped packages)
				const parts = importPath.split('/')
				let pkgName = parts[0]
				
				if (pkgName.startsWith('@')) {
					pkgName = parts.slice(0, 2).join('/')
				}
				
				imports.add(pkgName)
			}
		}
	}
	
	return imports
}

console.log('🔍 Analyzing Dependencies\n')
console.log('='.repeat(80))

const sourceFiles = getAllSourceFiles(process.cwd())
console.log(`\n📁 Found ${sourceFiles.length} source files\n`)

const usedPackages = new Set()
let processedFiles = 0

for (const file of sourceFiles) {
	try {
		const content = readFileSync(file, 'utf-8')
		const imports = extractImports(content)
		imports.forEach(pkg => usedPackages.add(pkg))
		processedFiles++
	} catch (error) {
		// Skip files that can't be read
	}
}

console.log(`✅ Processed ${processedFiles} files`)
console.log(`📦 Found ${usedPackages.size} unique package imports\n`)

// Find potentially unused dependencies
const unusedDeps = []
const usedDeps = []

for (const [depName, version] of Object.entries(allDeps)) {
	if (alwaysUsed.some(used => depName.includes(used))) {
		usedDeps.push(depName)
		continue
	}
	
	// Check if package is used
	const isUsed = Array.from(usedPackages).some(used => {
		// Exact match
		if (used === depName) return true
		
		// Scoped package match
		if (depName.startsWith('@') && used.startsWith(depName.split('/')[0])) {
			return true
		}
		
		// Special cases
		if (specialImports[depName] && used.includes(specialImports[depName])) {
			return true
		}
		
		return false
	})
	
	if (isUsed) {
		usedDeps.push(depName)
	} else {
		unusedDeps.push(depName)
	}
}

console.log('\n📊 Results:\n')
console.log(`✅ Used dependencies: ${usedDeps.length}`)
console.log(`⚠️  Potentially unused: ${unusedDeps.length}\n`)

if (unusedDeps.length > 0) {
	console.log('⚠️  Potentially Unused Dependencies:\n')
	unusedDeps.sort().forEach(dep => {
		console.log(`   - ${dep}`)
	})
	console.log('\n💡 Note: These might be used in:')
	console.log('   - Config files (next.config.mjs, tailwind.config.ts, etc.)')
	console.log('   - Build scripts')
	console.log('   - Dynamic imports')
	console.log('   - Type definitions')
	console.log('   - Server-side only code')
	console.log('\n   Review manually before removing!\n')
} else {
	console.log('✅ All dependencies appear to be used!\n')
}

// Show largest dependencies
console.log('\n📦 Largest Dependencies (by package.json order):\n')
const largeDeps = [
	'reactflow', '@langchain', 'react', 'next', 'framer-motion',
	'@radix-ui', 'lucide-react', 'react-icons', 'bullmq', 'ioredis'
]

largeDeps.forEach(dep => {
	if (allDeps[dep] || Object.keys(allDeps).some(d => d.includes(dep))) {
		const matching = Object.keys(allDeps).filter(d => d.includes(dep))
		matching.forEach(d => console.log(`   - ${d}`))
	}
})

console.log('\n✅ Analysis complete!')
