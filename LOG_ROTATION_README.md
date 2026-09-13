# Log Rotation Configuration

## Overview

Log rotation is configured to prevent unbounded log file growth and automatically manage log files for the IT Asset Management application.

## Configuration

**Location:** `/etc/logrotate.d/asset-management`
**Source:** `logrotate.conf` in this directory

### Rotation Schedule

- **Frequency:** Daily (or when log exceeds 100MB)
- **Retention:** 30 days
- **Compression:** Yes (gzip, delayed by one rotation)
- **Max Size:** 100MB per log file
- **Method:** copytruncate (safe for running applications)

### Managed Log Files

All log files in `logs/` directory:
- `app.log` - Main application logs
- `gunicorn-access.log` - HTTP access logs
- `gunicorn-error.log` - Gunicorn error logs
- `api.log` - API logs
- `api_server.log` - API server logs
- `backend.log` - Backend logs
- `production.log` - Production logs

## Installation

### Automated Installation

```bash
sudo ./install-logrotate.sh
```

### Manual Installation

```bash
sudo cp logrotate.conf /etc/logrotate.d/asset-management
sudo chmod 644 /etc/logrotate.d/asset-management
sudo chown root:root /etc/logrotate.d/asset-management
```

## Testing

### Test Rotation Manually

Force an immediate rotation (useful for testing):

```bash
sudo logrotate -f /etc/logrotate.d/asset-management
```

### Dry Run (No Changes)

Test configuration without actually rotating files:

```bash
sudo logrotate -d /etc/logrotate.d/asset-management
```

### Verbose Mode

Run with detailed output:

```bash
sudo logrotate -v /etc/logrotate.d/asset-management
```

## Verification

### Check Rotation Status

```bash
sudo cat /var/lib/logrotate/status | grep asset-management
```

### View Current Log Sizes

```bash
ls -lh logs/*.log
```

### View Rotated Logs

```bash
ls -lh logs/*.log-* logs/*.log.*.gz
```

## Automatic Execution

Logrotate runs automatically via cron:
- **Location:** `/etc/cron.daily/logrotate`
- **Schedule:** Daily at ~6:25 AM (varies by system)
- **User:** root

To check when logrotate last ran:

```bash
sudo grep logrotate /var/log/syslog | tail -5
```

## Log File Naming

### Current Logs
- `app.log` (active, growing)

### Rotated Logs (First Rotation)
- `app.log-20260913` (uncompressed, yesterday's log)

### Rotated Logs (Subsequent Rotations)
- `app.log-20260912.gz` (compressed, older logs)
- `app.log-20260911.gz`
- etc.

## Retention Policy

Logs are automatically deleted after 30 days. To change retention:

1. Edit `logrotate.conf`
2. Change `rotate 30` to desired number of days
3. Reinstall: `sudo cp logrotate.conf /etc/logrotate.d/asset-management`

## Disk Space Management

With current configuration:
- **Max uncompressed logs:** ~8MB × 2 days = 16MB
- **Max compressed logs:** ~1MB × 28 days = 28MB
- **Total max disk usage:** ~50MB for all log history

Compression ratio typically 10:1 for text logs.

## Troubleshooting

### Error: "parent directory has insecure permissions"

**Solution:** The `su administrator administrator` directive in the config handles this. If you still see this error:

```bash
# Check logs directory permissions
ls -ld logs/

# Should be: drwxrwxr-x (775) or drwxr-xr-x (755)
```

### Logs Not Rotating

1. Check logrotate status:
   ```bash
   sudo cat /var/lib/logrotate/status | grep asset
   ```

2. Check for errors in syslog:
   ```bash
   sudo grep logrotate /var/log/syslog | tail -20
   ```

3. Test manually:
   ```bash
   sudo logrotate -v /etc/logrotate.d/asset-management
   ```

### Application Not Writing to Logs After Rotation

This should not happen with `copytruncate` method, but if it does:

```bash
# Restart the application
sudo systemctl restart asset-management

# Or send HUP signal to gunicorn
pkill -HUP gunicorn
```

## Manual Log Cleanup

If you need to manually clean up old logs:

```bash
# Remove logs older than 30 days
find logs/ -name "*.log-*" -mtime +30 -delete

# Remove compressed logs older than 30 days
find logs/ -name "*.log.*.gz" -mtime +30 -delete
```

## Monitoring

### Set Up Log Size Alerts

Add to monitoring system to alert if logs exceed thresholds:

```bash
# Check if any log file exceeds 100MB
find logs/ -name "*.log" -size +100M
```

### Check Disk Space

```bash
# Show disk usage of logs directory
du -sh logs/

# Show individual log file sizes
du -h logs/*.log | sort -h
```

## Production Recommendations

1. **Monitor disk space:** Set up alerts for disk usage > 80%
2. **Verify rotation:** Check monthly that old logs are being deleted
3. **Test restoration:** Periodically verify you can decompress old logs
4. **Adjust retention:** Modify based on compliance requirements
5. **External backup:** Consider copying logs to external storage before deletion

## Compliance Notes

- Logs are retained for 30 days by default
- Adjust retention based on your compliance requirements (GDPR, SOX, etc.)
- Consider log aggregation service (ELK, Splunk, etc.) for longer retention
- Compressed logs can be archived to S3/external storage before deletion

## Configuration Reference

Full `logrotate.conf` options used:

| Option | Purpose |
|--------|---------|
| `su administrator administrator` | Run as specific user/group |
| `daily` | Rotate logs daily |
| `rotate 30` | Keep 30 rotations |
| `compress` | Compress old logs with gzip |
| `delaycompress` | Don't compress most recent rotation |
| `missingok` | Don't error if log file missing |
| `notifempty` | Don't rotate empty logs |
| `create 0664 administrator administrator` | Create new log files with permissions |
| `dateext` | Use date in rotated filename |
| `dateformat -%Y%m%d` | Date format YYYYMMDD |
| `copytruncate` | Copy and truncate (safe for open files) |
| `maxsize 100M` | Force rotation if file exceeds 100MB |

## Support

For issues with log rotation:
1. Check this README
2. Review `/var/log/syslog` for logrotate errors
3. Test configuration: `sudo logrotate -d /etc/logrotate.d/asset-management`
4. Contact system administrator

---

**Last Updated:** September 13, 2026
**Configuration Version:** 1.0
