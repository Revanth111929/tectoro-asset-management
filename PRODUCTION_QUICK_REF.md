# Production Quick Reference Card 🚀

## The "Address already in use" Problem

**Error you got**:
```
Address already in use
Port 3000 is in use by another program.
```

**What it means**: Something is already running on port 3000.

**The Fix**:
```bash
./production_stop.sh
./production_start.sh
```

---

## 4 Magic Scripts

### Start
```bash
./production_start.sh
```
Starts the app in background, saves PID, shows status

### Stop
```bash
./production_stop.sh
```
Gracefully stops the app, frees port 3000

### Restart
```bash
./production_restart.sh
```
Stop + Start (use after making changes)

### Status
```bash
./production_status.sh
```
Shows: PID, port status, API health, logs, CPU/memory

---

## Most Common Scenarios

### Scenario 1: "Address already in use"
```bash
./production_stop.sh
./production_start.sh
```

### Scenario 2: Just made code changes
```bash
./production_restart.sh
```

### Scenario 3: Updated frontend
```bash
cd frontend
npm run build
cd ..
./production_restart.sh
```

### Scenario 4: Is it running?
```bash
./production_status.sh
```

### Scenario 5: Something's wrong
```bash
# Check logs
tail -50 logs/production.log

# Or live logs
tail -f logs/production.log
```

### Scenario 6: Nuclear option (kill everything)
```bash
fuser -k 3000/tcp
./production_start.sh
```

---

## One-Liners

```bash
# What's on port 3000?
lsof -i:3000

# Kill port 3000
fuser -k 3000/tcp

# Is Python app running?
ps aux | grep 'python.*app' | grep -v grep

# View logs
tail -f logs/production.log

# API health check
curl http://localhost:3000/api/dashboard/stats

# Browser test
firefox http://192.168.20.180:3000
```

---

## Don't Do This in Production

❌ **Don't**: `python api_server.py` (manual start)
✅ **Do**: `./production_start.sh`

❌ **Don't**: `npm start` (dev server)
✅ **Do**: `npm run build` then restart

❌ **Don't**: `kill -9 <PID>` (force kill)
✅ **Do**: `./production_stop.sh` (graceful)

❌ **Don't**: Edit files directly on server
✅ **Do**: Test locally, then deploy

---

## Emergency Procedures

### App is frozen
```bash
./production_restart.sh
```

### Port won't free up
```bash
sudo fuser -k 3000/tcp
./production_start.sh
```

### Can't access from browser
```bash
# 1. Check if running
./production_status.sh

# 2. Test API directly
curl http://localhost:3000/api/dashboard/stats

# 3. Check firewall
sudo ufw status

# 4. Restart everything
./production_restart.sh
```

### Database errors
```bash
# Backup first
cp assets.db assets.db.backup

# Restart
./production_restart.sh
```

---

## Daily Workflow

### Morning (Start work)
```bash
cd /home/administrator/Desktop/asset-management
./production_status.sh
# If not running:
./production_start.sh
```

### After Making Changes
```bash
# Backend changes
./production_restart.sh

# Frontend changes
cd frontend
npm run build
cd ..
./production_restart.sh
```

### Evening (End of day)
```bash
# Optional: stop to save resources
./production_stop.sh

# Or leave it running 24/7
# (recommended for production)
```

---

## File Locations

```
📁 /home/administrator/Desktop/asset-management/
  📄 production_start.sh      ← START
  📄 production_stop.sh       ← STOP
  📄 production_restart.sh    ← RESTART
  📄 production_status.sh     ← STATUS
  📄 app.pid                  ← Process ID
  📁 logs/
    📄 production.log         ← Logs here
```

---

## When to Use Each Script

| Situation | Command |
|-----------|---------|
| Starting fresh | `./production_start.sh` |
| Made code changes | `./production_restart.sh` |
| Updating frontend | `cd frontend && npm run build && cd .. && ./production_restart.sh` |
| Port conflict error | `./production_stop.sh && ./production_start.sh` |
| Check if running | `./production_status.sh` |
| Something's wrong | `tail -50 logs/production.log` |
| End of day | `./production_stop.sh` (optional) |

---

## Pro Tips

💡 **Tip 1**: Always use the scripts, never run `python app.py` directly

💡 **Tip 2**: Check status before starting: `./production_status.sh`

💡 **Tip 3**: Logs are your friend: `tail -f logs/production.log`

💡 **Tip 4**: Port 3000 conflicts? Always stop first: `./production_stop.sh`

💡 **Tip 5**: Frontend not updating? Hard refresh: **Ctrl+Shift+R**

💡 **Tip 6**: For 24/7 uptime, set up systemd service (see full guide)

---

## Contact & Support

📖 **Full Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`

🆘 **Troubleshooting**: See full guide, section "Troubleshooting"

📝 **Logs**: `tail -50 logs/production.log`

---

**Last Updated**: July 29, 2026  
**Quick Reference Version**: 1.0
