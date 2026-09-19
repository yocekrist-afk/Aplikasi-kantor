const fs = require('fs');
const file = 'src/pages/participant/TestEngine.tsx';
let content = fs.readFileSync(file, 'utf8');

const protectionCode = `
  // Prevent Copy, Right Click, and provide basic anti-screenshot overlay logic
  useEffect(() => {
    // 1. Prevent Right Click (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Tindakan ini dilarang selama pengerjaan tes.");
    };

    // 2. Prevent Copy/Cut/Paste
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Tindakan ini dilarang selama pengerjaan tes.");
    };

    // 3. Prevent Print Screen (Print)
    const handlePrint = (e: KeyboardEvent) => {
      // Prevent Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        alert("Tindakan ini dilarang selama pengerjaan tes.");
      }
      
      // Prevent PrintScreen key if detectable (often handled by OS, but we try)
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard immediately
        alert("Tindakan ini dilarang selama pengerjaan tes.");
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handlePrint);
    
    // Add CSS protection dynamically
    const style = document.createElement('style');
    style.innerHTML = \`
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      @media print {
        body { display: none !important; }
      }
    \`;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handlePrint);
      document.head.removeChild(style);
    };
  }, []);
`;

content = content.replace(
  "  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);",
  "  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);\n\n" + protectionCode
);

fs.writeFileSync(file, content);
