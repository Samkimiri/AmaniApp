/**
 * Backs up (and restores) the same JSON produced by src/data/backup.ts to
 * a *private, hidden* area of the signed-in user's own Google Drive — the
 * "appDataFolder" special space, which only this app can see or touch;
 * it never shows up in the user's regular Drive file list. Each person
 * who connects authorizes their own account, so this is genuinely
 * per-user storage, not a shared server this app controls.
 */

const BACKUP_FILENAME = "amani-backup.json";

interface DriveFile {
  id: string;
  name: string;
}

async function findBackupFile(accessToken: string): Promise<DriveFile | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(
      `name='${BACKUP_FILENAME}'`
    )}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Google Drive couldn't be reached (${res.status})`);
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files?.[0] ?? null;
}

/** Uploads (or overwrites, if one already exists) the backup file in the
 * user's private app-data space. */
export async function uploadBackupToDrive(accessToken: string, json: string): Promise<void> {
  const existing = await findBackupFile(accessToken);
  const boundary = "amani-backup-boundary";
  const metadata = existing ? { name: BACKUP_FILENAME } : { name: BACKUP_FILENAME, parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${json}\r\n` +
    `--${boundary}--`;

  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Couldn't upload to Google Drive (${res.status})`);
}

/** Returns the backup JSON from the user's private app-data space, or
 * null if they've never backed up from this (or any) device before. */
export async function downloadBackupFromDrive(accessToken: string): Promise<string | null> {
  const existing = await findBackupFile(accessToken);
  if (!existing) return null;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Couldn't download from Google Drive (${res.status})`);
  return res.text();
}
