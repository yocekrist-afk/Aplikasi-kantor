import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { ZipArchive } from "archiver";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Source code export route
  app.get("/api/export-source", (req, res) => {
    try {
      const archive = new ZipArchive({
        zlib: { level: 9 } // Sets the compression level.
      });

      // Set headers for download
      res.attachment('psychist_source_code.zip');
      
      archive.on('error', (err) => {
        res.status(500).send({error: err.message});
      });

      // Pipe archive data to the response
      archive.pipe(res);

      // Directories and files to exclude
      const excludeDirs = ['node_modules', 'dist', '.git', '.cache'];
      
      // Add files recursively, ignoring excluded directories
      const rootDir = process.cwd();
      
      function addDirToArchive(dirPath: string, archivePath: string) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (excludeDirs.includes(file)) continue;
          
          const fullPath = path.join(dirPath, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            addDirToArchive(fullPath, path.join(archivePath, file));
          } else {
            archive.file(fullPath, { name: path.join(archivePath, file) });
          }
        }
      }
      
      addDirToArchive(rootDir, '');
      archive.finalize();

    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).send("Error generating zip: " + err.message + "\n" + err.stack);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
