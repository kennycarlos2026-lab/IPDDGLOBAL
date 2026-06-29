// ============================================================
// IPDD SYNC TO DRIVE — sync-to-drive.js
// Script diario: mueve archivos de Supabase Storage a Google Drive
// Ejecutado por GitHub Actions cada día a las 3 AM (BRT)
//
// Flujo:
//  1. Busca attachments donde storage_path empieza con 'temp/'
//  2. Descarga cada archivo desde Supabase Storage
//  3. Lo sube a Google Drive con la Service Account
//  4. Actualiza la fila en attachments: storage_path=driveFileId, public_url=driveUrl
//  5. Elimina el archivo de Supabase Storage
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const { Readable } = require('stream');

// ── CREDENCIALES DESDE VARIABLES DE ENTORNO ────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en variables de entorno');
    process.exit(1);
}
if (!GOOGLE_SA_JSON) {
    console.error('❌ Falta GOOGLE_SERVICE_ACCOUNT_JSON en variables de entorno');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLIENTE GOOGLE DRIVE (Service Account) ─────────────────────
let credentials;
try {
    credentials = JSON.parse(GOOGLE_SA_JSON);
} catch (e) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido:', e.message);
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
});
const drive = google.drive({ version: 'v3', auth });

// ── IDs DE CARPETAS EN GOOGLE DRIVE ───────────────────────────
const DRIVE_FOLDERS = {
    root:     '1T6kSihu-l7BrxidER_KzpveZ2cNYRR6q',
    churches: '1oQMiG-1B3e0fBV_sQqes1HCiqCf0od0K',
    members:  '1VxFkIFZpA-2KKvHvg8SEvF3Hw6iXXQS-',
    monthly:  '1aCcvN52vPBvCYmDgVwD6lT4Zjx7PCGRt'
};

// ── OBTENER O CREAR SUB-CARPETA EN DRIVE ──────────────────────
async function getOrCreateFolder(drive, parentId, folderName) {
    const safeName = folderName.replace(/[\/\\]/g, '-');
    const res = await drive.files.list({
        q: `'${parentId}' in parents and name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
    });
    if (res.data.files.length > 0) return res.data.files[0].id;

    const folder = await drive.files.create({
        requestBody: {
            name: safeName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        },
        fields: 'id'
    });
    return folder.data.id;
}

// ── SUBIR ARCHIVO A GOOGLE DRIVE ──────────────────────────────
async function uploadToDrive(fileBuffer, fileName, mimeType, parentFolderId) {
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

    // Hacer público (cualquiera con el link puede ver)
    await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: 'reader', type: 'anyone' }
    });

    const isPdf = (mimeType || '').includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    const publicUrl = isPdf
        ? `https://drive.google.com/file/d/${fileId}/view`
        : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

    return {
        fileId,
        publicUrl,
        fileName: response.data.name,
        isPdf
    };
}

// ── FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN ────────────────────────
async function syncFiles() {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   IPDD — Sync Supabase Storage → Drive        ║');
    console.log(`║   Inicio: ${new Date().toISOString()}                ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    // Buscar archivos no sincronizados (todavía en temp/)
    const { data: attachments, error } = await supabase
        .from('attachments')
        .select('*')
        .like('storage_path', 'temp/%')
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        console.error(`❌ Error al consultar attachments: ${error.message}`);
        process.exit(1);
    }

    if (!attachments || attachments.length === 0) {
        console.log('✅ No hay archivos pendientes de sincronizar.');
        console.log('');
        return;
    }

    console.log(`📋 ${attachments.length} archivo(s) pendiente(s) de sincronizar\n`);

    let synced = 0;
    let failed = 0;

    for (const att of attachments) {
        try {
            console.log(`  📤 [${synced + failed + 1}/${attachments.length}] ${att.file_name}`);

            // 1. Descargar desde Supabase Storage
            const { data: fileData, error: downloadErr } = await supabase.storage
                .from('ipdd-attachments')
                .download(att.storage_path);

            if (downloadErr) {
                console.error(`     ❌ Error descarga: ${downloadErr.message}`);
                failed++;
                continue;
            }

            const buffer = Buffer.from(await fileData.arrayBuffer());

            // 2. Determinar carpeta destino en Drive
            //    El path es: temp/{entity_type}/{entity_id}/{attachment_key}/{filename}
            const pathParts = att.storage_path.split('/');
            const entityType = pathParts[1];  // church | monthly_report | member
            const entityId   = pathParts[2];  // BR CE-001 o UUID

            let driveCategory;
            if (entityType === 'church')        driveCategory = 'churches';
            else if (entityType === 'monthly_report') driveCategory = 'monthly';
            else if (entityType === 'member')   driveCategory = 'members';
            else {
                console.warn(`     ⚠️  Tipo de entidad desconocido: ${entityType}, usando churches`);
                driveCategory = 'churches';
            }

            const categoryFolderId = DRIVE_FOLDERS[driveCategory];
            if (!categoryFolderId) {
                console.error(`     ❌ No se encontró la carpeta Drive para: ${driveCategory}`);
                failed++;
                continue;
            }

            // Crear carpeta entity_id dentro de la categoría
            let targetFolderId = await getOrCreateFolder(drive, categoryFolderId, entityId);

            // Crear sub-carpeta según attachment_key
            const attachmentKey = pathParts[3] || 'general';
            targetFolderId = await getOrCreateFolder(drive, targetFolderId, attachmentKey);

            // 3. Subir a Google Drive
            const driveResult = await uploadToDrive(
                drive,
                buffer,
                att.file_name,
                att.file_type,
                targetFolderId
            );

            // 4. Actualizar registro en Supabase
            const { error: updateErr } = await supabase
                .from('attachments')
                .update({
                    storage_path: driveResult.fileId,
                    public_url:   driveResult.publicUrl,
                    is_pdf:       driveResult.isPdf
                })
                .eq('id', att.id);

            if (updateErr) {
                console.error(`     ❌ Error actualizando DB: ${updateErr.message}`);
                failed++;
                continue;
            }

            // 5. Eliminar de Supabase Storage
            const { error: removeErr } = await supabase.storage
                .from('ipdd-attachments')
                .remove([att.storage_path]);

            if (removeErr) {
                console.warn(`     ⚠️  No se pudo borrar de Storage: ${removeErr.message}`);
            }

            console.log(`     ✅ Sincronizado → ${driveResult.publicUrl}`);
            synced++;

        } catch (err) {
            console.error(`     ❌ Error inesperado: ${err.message}`);
            failed++;
        }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log(`║   ✅ Sync completado                          ║`);
    console.log(`║   Sincronizados: ${String(synced).padEnd(3)} | Fallidos: ${String(failed).padEnd(3)}           ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    if (failed > 0) process.exit(1);
}

syncFiles();
