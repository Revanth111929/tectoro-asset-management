"""
Run this script from your project root:
  python3 step4_api_js_patch.py
"""

patch = """
// ── ACKNOWLEDGMENT ───────────────────────────────────────────────────────────
export const ackAPI = {
  sendEmail:  (assetId) => api.post(`/assets/${assetId}/send-ack-email`),
  getStatus:  (assetId) => api.get(`/assets/${assetId}/ack-status`),
};

// ── EMAIL CONFIG ──────────────────────────────────────────────────────────────
export const emailConfigAPI = {
  get:    ()     => api.get('/email-config'),
  save:   (data) => api.post('/email-config', data),
  test:   (data) => api.post('/email-config/test', data),
};
"""

with open('frontend/src/services/api.js', 'r') as f:
    content = f.read()

if 'ackAPI' not in content:
    # Insert before last line (export default api)
    content = content.replace('export default api;', patch + '\nexport default api;')
    with open('frontend/src/services/api.js', 'w') as f:
        f.write(content)
    print("✅ api.js updated")
else:
    print("⚠️  ackAPI already exists")
