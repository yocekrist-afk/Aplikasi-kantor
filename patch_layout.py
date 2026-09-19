import re

with open('src/components/layout/AppLayout.tsx', 'r') as f:
    text = f.read()

# Add PWAInstallButton import
if "import { PWAInstallButton }" not in text:
    text = text.replace(
        "import { ThemeToggle } from '../ThemeToggle';",
        "import { ThemeToggle } from '../ThemeToggle';\nimport { PWAInstallButton } from '../PWAInstallButton';"
    )

# Inject PWAInstallButton next to the ThemeToggle in Header
# In mobile header:
# <ThemeToggle />
# <button
#   onClick={() => setIsMobileMenuOpen(true)}
mobile_header = """          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(true)}"""
text = re.sub(
    r'<div className="flex items-center gap-2">\s*<ThemeToggle />\s*<button\s*onClick=\{\(\) => setIsMobileMenuOpen\(true\)\}',
    mobile_header,
    text
)

# In desktop header:
#           <ThemeToggle />
#           
#           <div className="h-8 w-px bg-slate-700/50 hidden md:block"></div>
desktop_header = """          <PWAInstallButton />
          <ThemeToggle />
          
          <div className="h-8 w-px bg-slate-700/50 hidden md:block dark:bg-slate-700"></div>"""
text = re.sub(
    r'<ThemeToggle />\s*<div className="h-8 w-px bg-slate-700/50 hidden md:block"></div>',
    desktop_header,
    text
)

with open('src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(text)

