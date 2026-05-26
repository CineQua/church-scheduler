# Deployment Guide

Church Scheduler is a single Docker image that serves the React frontend, the
Express API, and stores everything in a SQLite database on a **persistent
volume mounted at `/data`**. Any host that can run a Docker image and attach a
persistent disk will work. This guide covers **Render** and **Railway**.

> ⚠️ **The `/data` volume is critical.** It holds your only copy of the
> database (users, members, schedules). If a platform runs your container
> without a persistent disk, all data is wiped on every redeploy. Always attach
> a disk/volume at `/data` and back it up (see [Backup & Restore](#backup--restore)).

## Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | Set to `production`. Enables HTTPS-only cookies and strict secret checks. |
| `JWT_SECRET` | yes | Random string, **≥ 32 chars**. Generate: `openssl rand -hex 32`. The app refuses to start in production without it. |
| `DATABASE_PATH` | recommended | `/data/church-scheduler.sqlite` (matches the mounted volume). |
| `ADMIN_EMAIL` | first boot | Email of the first Super Admin, created automatically on first launch. |
| `ADMIN_PASSWORD` | first boot | Password for that admin (≥ 8 chars). **Change it after first login.** |
| `ADMIN_NAME` | optional | Display name for the first admin. |
| `PORT` | optional | Defaults to `3001`. Most platforms set this for you — the app reads it. |
| `JWT_EXPIRES_IN` | optional | Session lifetime, e.g. `7d`. |

Once the first Super Admin exists, `ADMIN_EMAIL`/`ADMIN_PASSWORD` are ignored;
they are safe to leave set.

---

## Render

1. Push this repository to GitHub/GitLab.
2. In the Render dashboard: **New → Web Service**, connect the repo.
3. Render auto-detects the `Dockerfile`. Leave build/start commands empty
   (the image's `CMD` runs the server).
4. **Add a persistent disk** (Settings → Disks):
   - **Mount path:** `/data`
   - **Size:** 1 GB is plenty to start.
5. **Add environment variables** (Environment tab):
   ```
   NODE_ENV=production
   JWT_SECRET=<output of: openssl rand -hex 32>
   DATABASE_PATH=/data/church-scheduler.sqlite
   ADMIN_EMAIL=admin@yourchurch.org
   ADMIN_PASSWORD=<a strong password>
   ```
   Do **not** set `PORT` — Render injects it and the app honours it.
6. Deploy. Render gives you an HTTPS URL (`https://your-app.onrender.com`).
7. Visit the URL, log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then create your
   other admins under **Users** and change the seed password.

> Render terminates TLS at its proxy; the app sets `trust proxy` in production
> so secure cookies work correctly. No extra config needed.

---

## Railway

1. **New Project → Deploy from GitHub repo** (Railway detects the `Dockerfile`).
2. **Add a Volume** (service → Variables/Settings → Volumes, or right-click the
   service → Add Volume):
   - **Mount path:** `/data`
3. **Add variables** (Variables tab):
   ```
   NODE_ENV=production
   JWT_SECRET=<output of: openssl rand -hex 32>
   DATABASE_PATH=/data/church-scheduler.sqlite
   ADMIN_EMAIL=admin@yourchurch.org
   ADMIN_PASSWORD=<a strong password>
   ```
   Railway sets `PORT` automatically; the app reads it.
4. **Generate a domain** (Settings → Networking → Generate Domain) to get an
   HTTPS URL.
5. Open the URL, log in, create your admins, change the seed password.

---

## Backup & Restore

The entire application state is the single SQLite file at
`/data/church-scheduler.sqlite` (plus its `-wal`/`-shm` companions while
running). Backing up = copying that file somewhere safe.

### Local Docker / Docker Compose

Quick copy of the live file (fine for low-traffic apps — WAL mode keeps writes
consistent, but for a guaranteed snapshot use the stop/copy method below):

```bash
docker compose cp app:/data/church-scheduler.sqlite ./backup-$(date +%F).sqlite
```

The most reliable approach — **stop, copy, start** — avoids copying mid-write:

```bash
docker compose stop app
docker run --rm -v church-scheduler_church-data:/data -v "$PWD":/out alpine \
  cp /data/church-scheduler.sqlite /out/backup-$(date +%F).sqlite
docker compose start app
```

(The volume name is `church-scheduler_church-data` — confirm yours with
`docker volume ls`.)

### Render

- **Manual:** Render Shell (service → Shell tab):
  `cat /data/church-scheduler.sqlite > /tmp/x` then download, **or** use
  `render disk` snapshots if available on your plan. The easiest path is to add
  a small cron/manual job that copies the file to S3/Backblaze.
- Render also offers **disk snapshots** on paid plans — enable scheduled
  snapshots of the `/data` disk.

### Railway

- Use the service **Shell** to inspect `/data`, or attach the volume to a
  one-off job that uploads the file to object storage.
- Railway can snapshot volumes from the dashboard.

### Restore

1. Stop the app.
2. Replace `/data/church-scheduler.sqlite` with your backup file (delete any
   stale `-wal`/`-shm` siblings first).
3. Start the app. Existing data loads automatically; migrations are idempotent.

```bash
# Local Docker example
docker compose stop app
docker run --rm -v church-scheduler_church-data:/data -v "$PWD":/in alpine \
  sh -c "rm -f /data/church-scheduler.sqlite-wal /data/church-scheduler.sqlite-shm; \
         cp /in/backup-2026-05-25.sqlite /data/church-scheduler.sqlite"
docker compose start app
```

> **Tip:** Test your backups by restoring into a throwaway local container
> before you rely on them.
