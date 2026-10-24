# Solix Clothing Brand

Solix is a full-stack clothing store with a Next.js storefront, a NestJS API, and MongoDB Atlas.

## Run locally

Open two terminals after configuring the backend and frontend environment files:

```bash
cd solix-backend
npm install
npm run seed
npm run start:dev
```

```bash
cd solix-frontend
npm install
npm run dev
```

Storefront: [http://localhost:3001](http://localhost:3001)  
API: [http://localhost:3000](http://localhost:3000)

See each application README for Atlas, Send Money, seeding and verification details.

## Free production hosting

- Netlify builds the Next.js app from `solix-frontend` using `netlify.toml`.
- Render builds the NestJS API from `solix-backend` using `render.yaml`.
- Browser requests use `/api`; Next.js proxies them to `SERVER_API_URL` so secure login cookies remain first-party.
- Netlify needs `SERVER_API_URL` set to the Render URL and `NEXT_PUBLIC_SITE_URL` set to the final Netlify URL.
- Render needs `FRONTEND_URL` set to the final Netlify URL.
- Production uploads use Cloudinary through the variables listed in `solix-backend/.env.example`.

Keep real credentials in the hosting dashboards. Never commit either local `.env` file.
