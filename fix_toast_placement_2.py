import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# Completely remove all instances of successMsg
text = re.sub(r'\s*// Show success feedback.*?\},\s*3000\);', '', text, flags=re.DOTALL)

# Also remove the basic alert if there's any
text = re.sub(r"\s*alert\('Pengaturan berhasil disimpan!'\);", '', text)

# Now insert it purely correctly once
replace_pattern = r'await updateData\(configDoc\.id, payload\);\s*\}\s*else\s*\{\s*await addData\(payload\);\s*\}'

new_insert = """await updateData(configDoc.id, payload);
      } else {
        await addData(payload);
      }
      
      // Tampilkan notifikasi berhasil
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4';
      successMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span>Pengaturan berhasil disimpan!</span>';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if(document.body.contains(successMsg)) document.body.removeChild(successMsg);
        }, 300);
      }, 3000);"""

final_text = re.sub(replace_pattern, new_insert, text)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(final_text)

