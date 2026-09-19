import re

with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

# The bug is that the 'Simpan Pengaturan Keamanan' button doesn't use isSaving state for UI feedback.
# Let's fix that button:
replace_button = """                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-[#1C1C1C] hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}</span>
                </button>"""

text = re.sub(
    r'<button onClick=\{handleSave\} className="flex items-center space-x-2 bg-\[\#1C1C1C\] hover:bg-black text-white px-6 py-2\.5 rounded-lg text-sm font-bold transition-colors">\s*<Shield className="w-4 h-4" />\s*<span>Simpan Pengaturan Keamanan</span>\s*</button>',
    replace_button,
    text
)

# And to give better global feedback, let's make handleSave show a toast/alert or temporary success state.
# But there's no toast library installed. We can use native alert or just rely on the button spinner returning to normal quickly.
# The user wants to feel sure it applied. An alert is simple and explicit.
handle_save_orig = """  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { """

handle_save_new = """  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { """

# Actually, if we look at handleSave, it's:
#         await updateData(configDoc.id, payload);
#       } else {
#         await addData(payload);
#       }
#     } catch (error) { ... } finally { setIsSaving(false); }
# We can add an alert to the try block end.

text = text.replace(
    "await addData(payload);\n      }\n    } catch",
    "await addData(payload);\n      }\n      \n      // Show success feedback\n      const successMsg = document.createElement('div');\n      successMsg.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 font-medium';\n      successMsg.innerHTML = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"></path><polyline points=\"22 4 12 14.01 9 11.01\"></polyline></svg> Pengaturan berhasil disimpan';\n      document.body.appendChild(successMsg);\n      setTimeout(() => {\n        successMsg.style.opacity = '0';\n        successMsg.style.transition = 'opacity 0.3s ease';\n        setTimeout(() => document.body.removeChild(successMsg), 300);\n      }, 3000);\n      \n    } catch"
)

with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)

