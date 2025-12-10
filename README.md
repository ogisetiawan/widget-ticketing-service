<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

BM Ticketing Support Service - NestJS API untuk mengelola ticket support dengan integrasi Notion. Service ini menyediakan endpoint untuk membuat, membaca, dan query ticket yang tersimpan di Notion database.

## Features

- ✅ Create ticket dengan file upload support
- ✅ Get list tickets dengan pagination
- ✅ Query tickets dengan filter
- ✅ Get ticket by ID
- ✅ File upload langsung ke Notion
- ✅ HMAC authentication untuk security
- ✅ Support multiple file uploads (max 10 files)

## Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Notion Configuration
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
NOTION_DATASOURCE_ID=your_notion_datasource_id

# Security
SHARED_SECRET_KEY=your-strong-secret-key-here

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000
```

## API Endpoints

Semua endpoint memerlukan header `x-shared-secret` dengan value yang sesuai dengan `SHARED_SECRET_KEY` di environment variables.

### Base URL

```
http://localhost:3000
```

---

### 1. Create Ticket (POST)

Membuat ticket baru di Notion dengan support file upload.

**Endpoint:** `POST /bm-ticketing/tickets`

**Headers:**
```
x-shared-secret: your-strong-secret-key-here
Content-Type: multipart/form-data
```

**Request Body (FormData):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email pengguna |
| `subject` | string | Yes | Judul/subject ticket |
| `username` | string | Yes | Nama pengguna |
| `messages` | string | Yes | Deskripsi/pesan ticket |
| `type` | string | Yes | Tipe ticket: `Bug Report`, `Support`, atau `Feature Request` |
| `apps` | string | No | Nama aplikasi yang terkait |
| `files` | file[] | No | File upload (maksimal 10 files, max 20MB per file) |

**Response Success (201):**
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

**Response Error (400/401/500):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "email must be an email"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/bm-ticketing/tickets \
  -H "x-shared-secret: your-strong-secret-key-here" \
  -F "email=user@example.com" \
  -F "subject=Bug Report - Login Issue" \
  -F "username=John Doe" \
  -F "messages=Saya mengalami masalah saat login. Error muncul setelah memasukkan password." \
  -F "type=Bug Report" \
  -F "apps=Web Application" \
  -F "files=@/path/to/screenshot-error.png"
```

**cURL Example (Multiple Files):**
```bash
curl -X POST http://localhost:3000/bm-ticketing/tickets \
  -H "x-shared-secret: your-strong-secret-key-here" \
  -F "email=user@example.com" \
  -F "subject=Bug Report - Payment Gateway" \
  -F "username=Developer Team" \
  -F "messages=Payment gateway tidak berfungsi dengan baik. Berikut adalah screenshot dan log file." \
  -F "type=Bug Report" \
  -F "apps=E-commerce Platform" \
  -F "files=@/path/to/screenshot-error.png" \
  -F "files=@/path/to/console-log.png" \
  -F "files=@/path/to/error-log.txt"
```

**JavaScript/Fetch Example:**
```javascript
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('subject', 'Bug Report - Login Issue');
formData.append('username', 'John Doe');
formData.append('messages', 'Saya mengalami masalah saat login.');
formData.append('type', 'Bug Report');
formData.append('apps', 'Web Application');

// Add files
const fileInput = document.querySelector('input[type="file"]');
Array.from(fileInput.files).forEach(file => {
  formData.append('files', file);
});

fetch('http://localhost:3000/bm-ticketing/tickets', {
  method: 'POST',
  headers: {
    'x-shared-secret': 'your-strong-secret-key-here'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

### 2. Get Tickets List (GET)

Mendapatkan daftar tickets dari Notion dengan pagination support.

**Endpoint:** `GET /bm-ticketing/tickets`

**Headers:**
```
x-shared-secret: your-strong-secret-key-here
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page_size` | number | No | Jumlah item per halaman (default: Notion default) |
| `start_cursor` | string | No | Cursor untuk pagination (dari response sebelumnya) |

**Request Body (Optional - JSON):**
```json
{
  "filter": {
    "property": "Email",
    "email": {
      "equals": "user@example.com"
    }
  }
}
```

**Response Success (200):**
```json
{
  "statusCode": 200,
  "message": "Tickets retrieved successfully",
  "data": {
    "results": [
      {
        "id": "page-id",
        "properties": {
          "Subject": { "title": [{ "text": { "content": "Bug Report" } }] },
          "Email": { "email": "user@example.com" },
          "Type": { "select": { "name": "Bug Report" } }
        }
      }
    ],
    "has_more": false,
    "next_cursor": null
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/bm-ticketing/tickets?page_size=10" \
  -H "x-shared-secret: your-strong-secret-key-here"
```

**cURL Example (With Filter):**
```bash
curl -X GET "http://localhost:3000/bm-ticketing/tickets?page_size=10" \
  -H "x-shared-secret: your-strong-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Email",
      "email": {
        "equals": "user@example.com"
      }
    }
  }'
```

**cURL Example (With Pagination):**
```bash
# First request
curl -X GET "http://localhost:3000/bm-ticketing/tickets?page_size=10" \
  -H "x-shared-secret: your-strong-secret-key-here"

# Next page (gunakan next_cursor dari response sebelumnya)
curl -X GET "http://localhost:3000/bm-ticketing/tickets?page_size=10&start_cursor=abc123..." \
  -H "x-shared-secret: your-strong-secret-key-here"
```

---

### 3. Query Tickets (POST)

Query tickets dengan filter yang lebih kompleks.

**Endpoint:** `POST /bm-ticketing/tickets/query`

**Headers:**
```
x-shared-secret: your-strong-secret-key-here
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "filter": {
    "property": "Email",
    "email": {
      "equals": "user@example.com"
    }
  },
  "sorts": [
    {
      "property": "Subject",
      "direction": "descending"
    }
  ],
  "page_size": 10,
  "start_cursor": "optional-cursor-for-pagination"
}
```

**Response Success (200):**
```json
{
  "statusCode": 200,
  "message": "Query success",
  "data": {
    "results": [
      {
        "id": "page-id",
        "properties": {
          "Subject": { "title": [{ "text": { "content": "Bug Report" } }] },
          "Email": { "email": "user@example.com" }
        }
      }
    ],
    "has_more": false,
    "next_cursor": null
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/bm-ticketing/tickets/query \
  -H "x-shared-secret: your-strong-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "Email",
      "email": {
        "equals": "user@example.com"
      }
    },
    "sorts": [
      {
        "property": "Subject",
        "direction": "descending"
      }
    ],
    "page_size": 10
  }'
```

**cURL Example (Complex Filter):**
```bash
curl -X POST http://localhost:3000/bm-ticketing/tickets/query \
  -H "x-shared-secret: your-strong-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "and": [
        {
          "property": "Type",
          "select": {
            "equals": "Bug Report"
          }
        },
        {
          "property": "Email",
          "email": {
            "equals": "user@example.com"
          }
        }
      ]
    },
    "sorts": [
      {
        "property": "Subject",
        "direction": "ascending"
      }
    ]
  }'
```

---

### 4. Get Ticket by ID (GET)

Mendapatkan detail ticket berdasarkan page ID.

**Endpoint:** `GET /bm-ticketing/tickets/:pageId`

**Headers:**
```
x-shared-secret: your-strong-secret-key-here
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Notion page ID dari ticket |

**Response Success (200):**
```json
{
  "statusCode": 200,
  "message": "Ticket retrieved successfully",
  "data": {
    "id": "page-id",
    "properties": {
      "Subject": {
        "title": [{ "text": { "content": "Bug Report - Login Issue" } }]
      },
      "Email": {
        "email": "user@example.com"
      },
      "User": {
        "rich_text": [{ "text": { "content": "John Doe" } }]
      },
      "Messages": {
        "rich_text": [{ "text": { "content": "Saya mengalami masalah..." } }]
      },
      "Type": {
        "select": { "name": "Bug Report" }
      },
      "Attachments": {
        "files": [
          {
            "name": "screenshot.png",
            "type": "file_upload",
            "file_upload": {
              "id": "upload-id"
            }
          }
        ]
      }
    },
    "url": "https://notion.so/page-url"
  }
}
```

**Response Error (400/404/500):**
```json
{
  "statusCode": 400,
  "message": "pageId is required"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/bm-ticketing/tickets/abc123-def456-ghi789" \
  -H "x-shared-secret: your-strong-secret-key-here"
```

---

## Error Responses

Semua endpoint dapat mengembalikan error responses berikut:

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid shared secret"
}
```
**Penyebab:** Header `x-shared-secret` tidak sesuai atau tidak ada.

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "email must be an email"
}
```
**Penyebab:** Request body tidak valid atau field required tidak diisi.

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to create ticket",
  "error": "Notion API Error: ..."
}
```
**Penyebab:** Error dari Notion API atau server error.

---

## File Upload

### Supported File Types
- Images: PNG, JPG, JPEG, GIF, WEBP
- Documents: PDF, DOC, DOCX, TXT
- Other: Semua file type yang didukung Notion

### File Size Limits
- **Single-part upload**: Maksimal 20MB per file
- **Multiple files**: Maksimal 10 files per request
- File > 20MB akan menggunakan fallback (external URL)

### File Upload Process
1. File di-upload langsung ke Notion menggunakan Notion File Upload API
2. File ditambahkan ke property "Attachments" di page
3. Jika upload gagal, file disimpan lokal dan menggunakan external URL

---

## Security

### HMAC Authentication
Semua endpoint dilindungi dengan `HmacGuard` yang memerlukan header:
```
x-shared-secret: <SHARED_SECRET_KEY>
```

**Cara kerja:**
1. Set `SHARED_SECRET_KEY` di environment variables
2. Include header `x-shared-secret` di setiap request
3. Guard akan memvalidasi secret sebelum memproses request

**Best Practices:**
- Gunakan secret key yang kuat dan unik
- Jangan commit secret key ke repository
- Rotate secret key secara berkala
- Gunakan HTTPS di production

---

## Testing dengan Postman

### Setup Postman Collection

1. **Create New Collection**: "BM Ticketing API"

2. **Set Collection Variables:**
   - `base_url`: `http://localhost:3000`
   - `shared_secret`: `your-strong-secret-key-here`

3. **Set Collection Headers:**
   ```
   x-shared-secret: {{shared_secret}}
   ```

### Request Examples

#### 1. Create Ticket (POST)
- **Method**: POST
- **URL**: `{{base_url}}/bm-ticketing/tickets`
- **Headers**: 
  - `x-shared-secret`: `{{shared_secret}}`
- **Body**: 
  - Type: `form-data`
  - Fields:
    - `email`: `user@example.com`
    - `subject`: `Bug Report`
    - `username`: `John Doe`
    - `messages`: `Test message`
    - `type`: `Bug Report`
    - `apps`: `Web App`
    - `files`: (File) - Select file

#### 2. Get Tickets (GET)
- **Method**: GET
- **URL**: `{{base_url}}/bm-ticketing/tickets?page_size=10`
- **Headers**: 
  - `x-shared-secret`: `{{shared_secret}}`

#### 3. Query Tickets (POST)
- **Method**: POST
- **URL**: `{{base_url}}/bm-ticketing/tickets/query`
- **Headers**: 
  - `x-shared-secret`: `{{shared_secret}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
  ```json
  {
    "filter": {
      "property": "Email",
      "email": {
        "equals": "user@example.com"
      }
    }
  }
  ```

#### 4. Get Ticket by ID (GET)
- **Method**: GET
- **URL**: `{{base_url}}/bm-ticketing/tickets/:pageId`
- **Headers**: 
  - `x-shared-secret`: `{{shared_secret}}`
- **Params**: 
  - `pageId`: `abc123-def456-ghi789`

---

## Notes

- Semua endpoint memerlukan header `x-shared-secret` untuk authentication
- File upload maksimal 20MB per file untuk direct upload ke Notion
- File > 20MB akan menggunakan fallback mechanism
- Property di Notion: `Attachments` (bukan "Files & media")
- File di-upload langsung ke Notion, tidak melalui server lokal (kecuali fallback)

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Notion API Key
- Notion Database ID

### Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd widget-ticketing-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Install additional packages (if needed)**
```bash
npm install form-data
npm install --save-dev @types/form-data
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env file dengan konfigurasi yang sesuai
```

5. **Run the application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Project Structure

```
widget-ticketing-service/
├── src/
│   ├── common/
│   │   └── guards/
│   │       └── hmac.guard.ts      # HMAC authentication guard
│   ├── notion/
│   │   ├── notion.service.ts      # Notion API service
│   │   └── notion.module.ts       # Notion module
│   ├── tickets/
│   │   ├── dto/
│   │   │   └── create-ticket.dto.ts
│   │   ├── tickets.controller.ts  # Tickets endpoints
│   │   └── tickets.module.ts
│   ├── app.module.ts
│   └── main.ts
├── uploads/                        # Local file storage (fallback)
├── .env                            # Environment variables
└── package.json
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
