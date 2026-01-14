# Database Export Summary

**Export Date:** 2026-01-12T03:26:03.515Z
**Environment:** development

## Collections Overview

| Collection | Count | Description |
|------------|-------|-------------|
| Settings | 1 | App configuration and options |
| Campuses | 8 | Campus/location data |
| Skills | 13 | Skill categories and definitions |
| Users | 8 | All user accounts |
| Jobs | 4 | Job postings |
| Applications | 1 | Student applications |
| Placement Cycles | 6 | Placement cycles |
| Job Readiness Configs | 5 | Job readiness criteria configurations |
| Recent Notifications | 26 | Last 30 days notifications |

## User Distribution

- **Students:** 4
- **Coordinators:** 1
- **Campus POCs:** 2
- **Managers:** 1

## Important Notes

1. **Passwords:** User passwords are hashed and not exported in plain text
2. **Environment:** This export is from development environment
3. **File Location:** `database-export.json` contains full data
4. **Recreation:** Use `seed.js` and this export to recreate database

## MongoDB Connection Setup

To connect to deployed MongoDB, update `.env`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=<secure-jwt-secret>
NODE_ENV=production
```

## Next Steps

1. Set up MongoDB Atlas or deployed MongoDB instance
2. Update `.env` with connection string
3. Run `node seed.js` to populate initial data
4. Import additional data from `database-export.json` if needed
