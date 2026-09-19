with open('src/pages/Pengaturan.tsx', 'r') as f:
    text = f.read()

bad_string = """      </div>
    </div>
  );
}
          {activeTab === 'tampilan' && ("""

good_string = """                </div>
              </div>
            </div>
          )}
          {activeTab === 'tampilan' && ("""

if bad_string in text:
    text = text.replace(bad_string, good_string)
else:
    print("Could not find exact string. Here is what is around 'tampilan':")
    
with open('src/pages/Pengaturan.tsx', 'w') as f:
    f.write(text)
