# AgentSherlock — Quick Start Guide

## 1-Minute Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local: add DATABASE_URL
npm run prisma:migrate
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@host/database"
ANTHROPIC_API_KEY="sk-ant-..."  # For Session 3
```

**PostgreSQL:** Use [Neon](https://neon.tech) for free hosted PostgreSQL.

---

## Key URLs

| Page | URL |
|---|---|
| Landing | `/` |
| Dashboard | `/dashboard` |
| Create Incident | `/incidents/new` |
| View Incident | `/investigations/[id]` |

---

## Database Commands

```bash
npm run prisma:migrate      # Run migrations
npm run prisma:studio       # View data
npm run prisma:generate     # Regenerate client
```

---

## File Structure

```
app/              # Pages & API routes
├── api/          # REST API endpoints
├── dashboard/    # Dashboard page
├── incidents/    # Incident pages
└── investigations/  # Investigation pages

components/       # React components
lib/              # Utilities & database
prisma/           # Database schema
```

---

## Testing

### Create Incident
1. Go to `/incidents/new`
2. Fill form
3. (Optional) Upload files
4. Submit → Saved to database

### View Demo
1. Go to `/dashboard`
2. Click "Try Demo Incident"
3. Pre-built Payment API outage scenario

### Upload Files
- Logs: `.log`, `.txt`, `.json`, `.csv` (max 100MB each)
- Repository: `.zip` (max 100MB, auto-extracted)

---

## Troubleshooting

### Database Error
```bash
# Check connection string in .env.local
npm run prisma:generate
npm run prisma:migrate
```

### File Upload Error
- Check file size < 100MB
- Verify ZIP is valid archive
- Check upload directory has write permissions

### Port 3000 Already In Use
```bash
npm run dev -- -p 3001
```

---

## Architecture

```
User Actions
   ↓
Frontend (React/Next.js)
   ↓
API Routes (Next.js)
   ↓
Prisma Client
   ↓
PostgreSQL Database
   ↓
Stored Data
```

---

## Key Features (Session 2)

✅ **Database** - PostgreSQL + Prisma  
✅ **Incident CRUD** - Create, read, list, update  
✅ **File Upload** - Secure logs & repository ZIP  
✅ **Demo Incident** - Pre-built scenario  
✅ **Real Data** - Dashboard/pages connected to DB  

---

## Coming Soon (Session 3)

🚀 Claude AI investigation agent  
🚀 Automated root cause analysis  
🚀 Real-time streaming results  
🚀 Evidence generation  
🚀 Report generation  

---

## Docs

- `CLAUDE.md` - Complete documentation
- `README_SESSION_2.md` - Detailed implementation
- `SESSION_2_FINAL_SUMMARY.md` - What's implemented
- `Plan.md` - Original 25-point requirements

---

**Questions?** Check `CLAUDE.md` or examine the code in `app/api/` for examples.
