import re

with open('vite.config.ts', 'r') as f:
    text = f.read()

text = text.replace(
    "src: '/pwa-192x192.png'",
    "src: '/pwa-192x192.svg'"
).replace(
    "src: '/pwa-512x512.png'",
    "src: '/pwa-512x512.svg'"
).replace(
    "src: '/pwa-maskable-512x512.png'",
    "src: '/pwa-maskable-512x512.svg'"
).replace(
    "type: 'image/png'",
    "type: 'image/svg+xml'"
)

with open('vite.config.ts', 'w') as f:
    f.write(text)

