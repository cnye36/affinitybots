#!/bin/bash
# Quick cleanup script for unused packages

echo "🧹 Quick Cleanup Script"
echo "======================"
echo ""

# Check for unused supabase package
echo "Checking for unused 'supabase' package..."
if grep -q '"supabase"' package.json && ! grep -rq "from ['\"]supabase['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
	echo "✅ 'supabase' package appears unused (using @supabase/* instead)"
	echo "   Run: pnpm remove supabase"
else
	echo "⚠️  'supabase' package may be in use, verify before removing"
fi

echo ""
echo "Checking for other potentially unused packages..."

# Check react-burger-menu
if grep -q '"react-burger-menu"' package.json && ! grep -rq "from ['\"]react-burger-menu['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
	echo "✅ 'react-burger-menu' appears unused"
	echo "   Run: pnpm remove react-burger-menu"
fi

# Check react-toastify
if grep -q '"react-toastify"' package.json && ! grep -rq "from ['\"]react-toastify['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null; then
	echo "✅ 'react-toastify' appears unused (using sonner instead)"
	echo "   Run: pnpm remove react-toastify"
fi

echo ""
echo "✅ Cleanup check complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Review the packages above"
echo "   2. Run 'pnpm analyze:deps' for full analysis"
echo "   3. Remove confirmed unused packages"
echo "   4. Test your application after removal"
