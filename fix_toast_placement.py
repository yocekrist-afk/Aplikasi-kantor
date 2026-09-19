import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# I accidentally placed the toast inside the if (configDoc) block rather than after the try block finishes.
# Let's fix that. I'll remove the one I added and place it correctly at the end of the try block.

# First, remove the bad injection
remove_pattern = r'      // Show success feedback\s*const successMsg = document\.createElement\(\'div\'\);\s*successMsg\.className = \'fixed top-4 right-4.*?;\}\), 300\);\s*\}, 3000\);'

cleaned_text = re.sub(remove_pattern, '', text, flags=re.DOTALL)

# Now, find the end of the try block
replace_pattern = r'await updateData\(configDoc\.id, payload\);\s*\}\s*else\s*\{\s*await addData\(payload\);\s*\}\s*\} catch'

new_insert = """await updateData(configDoc.id, payload);
      } else {
        await addData(payload);
      }
      
      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-4 duration-300';
      successMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Pengaturan berhasil disimpan';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if(document.body.contains(successMsg)) document.body.removeChild(successMsg);
        }, 300);
      }, 3000);
    } catch"""

final_text = re.sub(replace_pattern, new_insert, cleaned_text)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(final_text)

