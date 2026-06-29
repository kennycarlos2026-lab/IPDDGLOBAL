// ============================================================
// IPDD DRIVE PROXY — server.js
// Servidor local que recibe archivos desde el browser y los
// sube a Google Drive usando la Service Account.
//
// USO:
//   1. Coloca tu archivo JSON de Service Account en esta carpeta
//      con el nombre: service-account.json
//   2. npm install
//   3. node server.js
//   La app HTML se conecta a http://localhost:3001
// ============================================================

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const { google } = require('googleapis');
const path     = require('path');
const fs       = require('fs');
const { Readable } = require('stream');

const app  = express();
const port = process.env.PORT || 3001;

// ── CORS: permite requests desde cualquier origen local ──────
app.use(cors());
app.use(express.json());

// ── Multer: guarda archivos en memoria (sin tocar el disco) ──
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

// ── IDs de carpetas en Google Drive (ya configurados) ────────
const DRIVE_FOLDERS = {
  root:    '1T6kSihu-l7BrxidER_KzpveZ2cNYRR6q',
  churches: '1oQMiG-1B3e0fBV_sQqes1HCiqCf0od0K',
  members:  '1VxFkIFZpA-2KKvHvg8SEvF3Hw6iXXQS-',
  monthly:  '1aCcvN52vPBvCYmDgVwD6lT4Zjx7PCGRt'
};

// ── Inicializar cliente de Google Drive ──────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

function getDriveClient() {
  let credentials;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Railway/Render: leer desde variable de entorno
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch(e) {
      throw new Error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido: ' + e.message);
    }
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    return google.drive({ version: 'v3', auth });
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error('❌ No se encontró service-account.json ni la variable GOOGLE_SERVICE_ACCOUNT_JSON');
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return google.drive({ version: 'v3', auth });
}

// ── Función helper: obtener/crear subcarpeta ─────────────────
async function getOrCreateFolder(drive, parentId, folderName) {
  // Buscar si ya existe
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Crear si no existe
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  });
  return folder.data.id;
}

// ── Función helper: subir archivo a Drive ────────────────────
async function uploadFileToDrive(drive, fileBuffer, fileName, mimeType, parentFolderId) {
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [parentFolderId]
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: stream
    },
    fields: 'id, name, webViewLink, webContentLink'
  });

  const fileId = response.data.id;

  // Hacer el archivo público (cualquiera con el link puede verlo)
  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  // Retornar la URL directa de descarga/visualización
  const fileInfo = await drive.files.get({
    fileId: fileId,
    fields: 'id, name, webViewLink, webContentLink, thumbnailLink'
  });

  // Para imágenes: usar URL directa de contenido; para PDFs: webViewLink
  const isPdf = (mimeType || '').includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const publicUrl = isPdf
    ? `https://drive.google.com/file/d/${fileId}/view`
    : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

  return {
    fileId,
    publicUrl,
    webViewLink: fileInfo.data.webViewLink,
    fileName: fileInfo.data.name
  };
}

// ============================================================
// ENDPOINT: POST /upload
// Body: multipart/form-data
//   - file: el archivo a subir
//   - churchId: ID de la sede (ej: "BR CE-001")
//   - category: 'churches' | 'members' | 'monthly'
//   - subFolder: nombre de subcarpeta dentro de la categoría
//              (ej: "contrato", "inventario", "deposito")
//   - entityId: ID adicional (church_id o member_uuid)
// ============================================================
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { churchId, category, subFolder, entityId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    if (!category || !DRIVE_FOLDERS[category]) {
      return res.status(400).json({ error: `Categoría inválida: ${category}. Usa: churches, members, monthly` });
    }

    console.log(`📁 Subiendo: ${file.originalname} (${(file.size/1024).toFixed(1)}KB) → Drive/${category}/${churchId || entityId}/${subFolder || ''}`);

    const drive = getDriveClient();
    const categoryFolderId = DRIVE_FOLDERS[category];

    // Crear estructura de carpetas: categoria/entidad/subFolder
    let targetFolderId = categoryFolderId;

    if (churchId) {
      const churchFolderId = await getOrCreateFolder(drive, categoryFolderId, churchId);
      targetFolderId = churchFolderId;
    }

    if (subFolder) {
      const subFolderId = await getOrCreateFolder(drive, targetFolderId, subFolder);
      targetFolderId = subFolderId;
    }

    // Generar nombre único para evitar colisiones
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).substring(0, 40);
    const uniqueName = `${base}_${timestamp}${ext}`;

    const result = await uploadFileToDrive(
      drive,
      file.buffer,
      uniqueName,
      file.mimetype,
      targetFolderId
    );

    console.log(`✅ Subido correctamente: ${result.publicUrl}`);

    res.json({
      success: true,
      fileId: result.fileId,
      url: result.publicUrl,
      webViewLink: result.webViewLink,
      fileName: file.originalname,
      isPdf: (file.mimetype || '').includes('pdf') || file.originalname.toLowerCase().endsWith('.pdf')
    });

  } catch (err) {
    console.error('❌ Error al subir a Drive:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT: GET /health — verificar que el proxy está vivo ─
app.get('/health', (req, res) => {
  const hasKey = fs.existsSync(SERVICE_ACCOUNT_PATH) || !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const mode = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'env var (Railway/Render)' : 'archivo local';
  res.json({
    status: 'OK',
    service_account_found: hasKey,
    mode,
    folders: DRIVE_FOLDERS,
    message: hasKey ? `✅ Listo (${mode})` : '⚠️ Falta service-account.json o GOOGLE_SERVICE_ACCOUNT_JSON'
  });
});

// ── ENDPOINT: DELETE /file/:fileId — eliminar archivo de Drive ─
app.delete('/file/:fileId', async (req, res) => {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId: req.params.fileId });
    console.log(`🗑️ Archivo eliminado de Drive: ${req.params.fileId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar de Drive:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(port, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║     IPDD Drive Proxy — Servidor Iniciado      ║');
  console.log(`║     Escuchando en http://localhost:${port}       ║`);
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH) && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn('⚠️  AVISO: No se encontró service-account.json ni la variable GOOGLE_SERVICE_ACCOUNT_JSON');
    console.warn('   Para uso LOCAL: copia tu JSON de Service Account aquí:');
    console.warn(`   ${SERVICE_ACCOUNT_PATH}`);
    console.warn('   Para RAILWAY/RENDER: agrega la variable GOOGLE_SERVICE_ACCOUNT_JSON');
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log('✅ Service Account: cargada desde variable de entorno (Railway/Render)');
    console.log('✅ Google Drive conectado');
  } else {
    const keyData = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    console.log(`✅ Service Account: ${keyData.client_email}`);
    console.log('✅ Google Drive conectado');
  }
  console.log('');
  console.log('Verifica el estado: GET http://localhost:3001/health');
  console.log('');
});
