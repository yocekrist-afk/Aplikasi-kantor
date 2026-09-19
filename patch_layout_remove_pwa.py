import re

with open('src/components/layout/AppLayout.tsx', 'r') as f:
    text = f.read()

# Remove PWAInstallButton from imports
text = re.sub(r'import \{ PWAInstallButton \} from \'../PWAInstallButton\';\n?', '', text)

# Remove from desktop and mobile headers
text = re.sub(r'<PWAInstallButton />\s*', '', text)

with open('src/components/layout/AppLayout.tsx', 'w') as f:
    f.write(text)
