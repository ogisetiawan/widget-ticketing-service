# File Upload ke Notion - Dokumentasi

## Overview

Implementasi upload file langsung ke Notion menggunakan Notion File Upload API. File akan di-upload langsung ke Notion dan dapat dibuka langsung dari property "Attachments" di Notion.

## Fitur

1. **Upload File Langsung ke Notion** - Menggunakan Notion File Upload API
2. **Support Multiple Files** - Bisa upload hingga 10 files sekaligus
3. **Auto Fallback** - Jika upload ke Notion gagal, akan menggunakan external URL
4. **File Size Validation** - Maksimal 20MB per file untuk single-part upload
5. **Property "Files & media"** - File otomatis ditambahkan ke property di Notion

## Cara Kerja

### 1. Upload File ke Notion (3 Langkah)

```
Step 1: POST /v1/file_uploads
  - Membuat file upload object
  - Mendapatkan upload_id

Step 2: POST /v1/file_uploads/{id}/upload
  - Upload konten file (multipart/form-data)
  - File dikirim sebagai buffer

Step 3: PATCH /v1/file_uploads/{id}/complete
  - Menyelesaikan proses upload
  - File siap digunakan
```

### 2. Menambahkan File ke Property

Setelah file berhasil di-upload, file ditambahkan ke property "Files & media" menggunakan `file_upload_id`:

```typescript
{
  "Files & media": {
    "files": [
      {
        "name": "filename.jpg",
        "type": "file_upload",
        "file_upload": {
          "id": "upload_id_dari_notion"
        }
      }
    ]
  }
}
```

### 3. Fallback Mechanism

Jika upload ke Notion gagal (misalnya karena file terlalu besar atau error), sistem akan:
1. Menyimpan file lokal di folder `uploads/`
2. Menggunakan external URL untuk property
3. Atau menambahkan file sebagai blocks di page content

## Installation

Install package yang diperlukan:

```bash
npm install form-data
npm install --save-dev @types/form-data
```

## Environment Variables

Pastikan `.env` sudah dikonfigurasi:

```env
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
NOTION_DATASOURCE_ID=your_datasource_id
BASE_URL=http://localhost:3000  # atau domain publik untuk production
```

## Usage

### Endpoint

```
POST /bm-ticketing/tickets
Content-Type: multipart/form-data
```

### Request Body (FormData)

```javascript
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('subject', 'Bug Report');
formData.append('username', 'John Doe');
formData.append('messages', 'Deskripsi masalah');
formData.append('type', 'Bug Report');
formData.append('apps', 'Web App');
formData.append('files', file1); // File object
formData.append('files', file2); // Multiple files
```

### Response

```json
{
  "statusCode": 201,
  "message": "Ticket created successfully",
  "data": {
    "id": "page-id-from-notion",
    "url": "https://notion.so/page-url"
  }
}
```

## File Size Limits

- **Single-part upload**: Maksimal 20MB per file
- **Multi-part upload**: Untuk file > 20MB (belum diimplementasikan)
- Jika file > 20MB, akan menggunakan fallback (external URL)

## Error Handling

1. **File terlalu besar**: Akan menggunakan external URL
2. **Upload gagal**: Akan menggunakan external URL atau blocks
3. **Network error**: Akan menggunakan fallback mechanism

## Troubleshooting

### File tidak bisa dibuka di Notion

1. **Pastikan BASE_URL adalah domain publik** (bukan localhost)
2. **Cek Notion API Key** - Pastikan valid dan memiliki permission
3. **Cek file size** - Pastikan tidak melebihi 20MB
4. **Cek console logs** - Lihat error message untuk detail

### Upload selalu gagal

1. **Cek Notion API Version** - Pastikan menggunakan versi terbaru
2. **Cek network connection** - Pastikan bisa akses api.notion.com
3. **Cek file format** - Pastikan file format didukung Notion

## Testing

### Test dengan cURL

```bash
curl -X POST http://localhost:3000/bm-ticketing/tickets \
  -F "email=test@example.com" \
  -F "subject=Test Upload" \
  -F "username=Test User" \
  -F "messages=Test message" \
  -F "type=Bug Report" \
  -F "files=@/path/to/image.png"
```

### Test dengan JavaScript

```javascript
const formData = new FormData();
formData.append('email', 'test@example.com');
formData.append('subject', 'Test Upload');
formData.append('username', 'Test User');
formData.append('messages', 'Test message');
formData.append('type', 'Bug Report');

const fileInput = document.querySelector('input[type="file"]');
formData.append('files', fileInput.files[0]);

fetch('http://localhost:3000/bm-ticketing/tickets', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

## Notes

1. **Notion API Version**: Menggunakan `2022-06-28`
2. **File Storage**: File juga disimpan lokal di `uploads/` sebagai backup
3. **Public URL**: Untuk production, pastikan `BASE_URL` adalah domain publik
4. **Security**: File di-upload langsung ke Notion, tidak melalui server kita

## Future Improvements

1. Support multi-part upload untuk file > 20MB
2. Progress tracking untuk upload besar
3. Retry mechanism untuk failed uploads
4. File compression sebelum upload