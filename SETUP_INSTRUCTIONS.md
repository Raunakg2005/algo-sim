# Setting up Algo-Sim

Algo-Sim runs on one campus server and needs no internet connection once its Docker images are built. Students
open it in a browser on the campus LAN. The simulations need no account; signing in is only needed to submit
feedback and to open the admin dashboard.

## Option A: Docker (recommended for labs)

Requirements: Docker Engine with the Compose plugin, on a machine the lab computers can reach.

1. Configure:
   ```bash
   cp .env.example .env
   ```
   In `.env`, set:
   - `NEXTAUTH_URL`: the address students will type, for example `http://10.0.0.5:3000`;
   - `NEXTAUTH_SECRET`: a random string; generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`;
   - `MONGO_ROOT_PASSWORD`: a database password;
   - `ADMIN_EMAILS`: the e-mail addresses of the instructors.

2. Build and start (the build is the only step that needs internet, to download images and npm packages):
   ```bash
   docker compose up -d --build
   ```
   To install on a server that is permanently offline, build the image on a connected machine and transfer it:
   ```bash
   docker compose build
   docker save algo-sim-app mongo:7.0 -o algo-sim-images.tar
   ```
   On the offline server:
   ```bash
   docker load -i algo-sim-images.tar
   docker compose up -d
   ```

3. Create accounts for a class from a CSV file with the header `username,name,email,password`. The `email` and
   `password` columns may be left empty; missing passwords are generated.
   ```bash
   docker compose cp students.csv app:/app/students.csv
   docker compose exec app node scripts/create-users.mjs students.csv credentials-out.csv
   docker compose cp app:/app/credentials-out.csv .
   ```
   `credentials-out.csv` lists the generated passwords. Give them to the students and keep the file private.
   Instructors need an account whose `email` is listed in `ADMIN_EMAILS`.

MongoDB is not published on the host: only the app container can reach it, and it requires the password from
`.env`. Data is kept in the `mongodb_data` volume. Back it up with:
```bash
docker compose exec mongodb mongodump --archive --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" > backup.archive
```

Useful commands:
```bash
docker compose logs -f app
docker compose down
docker compose up -d --build
```
`docker compose down` keeps the data volume. `docker compose up -d --build` rebuilds after an update.

## Option B: Node.js (development)

Requirements: Node.js 20 or later, and a MongoDB server.
```bash
npm ci
cp .env.example .env.local     # set MONGODB_URI, NEXTAUTH_URL, NEXTAUTH_SECRET, ADMIN_EMAILS
npm run dev                    # http://localhost:3000
```

Checks:
```bash
npm run typecheck   # TypeScript, strict mode
npm test            # property-based tests of every simulation engine
npm run build       # production build
```

## Optional sign-in methods (need internet)

- **Google:** set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Create them in the Google Cloud console with the
  redirect URI `<NEXTAUTH_URL>/api/auth/callback/google`.
- **E-mailed sign-in links:** set the `EMAIL_SERVER_*` and `EMAIL_FROM` variables. Each link is valid for 15 minutes.
- Set `LOCAL_AUTH=false` to turn off local accounts.

## Routes

| Route | Purpose | Sign-in |
| --- | --- | --- |
| `/` | Landing page | no |
| `/dashboard` | Course selection (AOA, DS) | no |
| `/simulate/<category>` | AOA simulations | no |
| `/simulate/ds/<category>` | DS simulations | no |
| `/feedback` | Feedback form | yes |
| `/admin` | Feedback analytics | admin |
