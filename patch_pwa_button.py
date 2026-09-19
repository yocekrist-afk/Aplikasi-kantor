import re

with open('src/components/PWAInstallButton.tsx', 'r') as f:
    text = f.read()

replacement = """  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Telah Diinstal
      </div>
    );
  }"""

text = re.sub(
    r'// If already running as an installed PWA, hide the button\s*if \(isInstalled\) \{\s*return null;\s*\}',
    replacement,
    text
)

# And if not installable (but not iOS), show a fallback message
fallback_replacement = """    );
  }

  return (
    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
      Tidak didukung di browser ini
    </div>
  );
};"""

text = re.sub(
    r'\s*\};\s*\}\s*return null;\s*\};',
    fallback_replacement,
    text
)

with open('src/components/PWAInstallButton.tsx', 'w') as f:
    f.write(text)

