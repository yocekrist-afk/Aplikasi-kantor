import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# Let's see how addData is called
search = re.search(r'await updateData\(configDoc.id, payload\);\s*\}\s*else\s*\{\s*await addData\(payload\);\s*\}', text)
if search:
    insert = """
      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity flex items-center gap-2 font-medium';
      successMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Pengaturan berhasil disimpan';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.opacity = '0';
        setTimeout(() => {
            if(document.body.contains(successMsg)) document.body.removeChild(successMsg);
        }, 300);
      }, 3000);"""
    
    text = text[:search.end()] + insert + text[search.end():]
    
    with open('src/pages/Pengaturan.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Failed to find pattern")
