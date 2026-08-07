"""
Add invoice file serving endpoints to api_server.py
Run this script to add the endpoints
"""

endpoint_code = '''

# ==================================================================================
# INVOICE ATTACHMENT ENDPOINTS
# ==================================================================================

@app.route('/api/assets/invoice/<path:filename>', methods=['GET'])
@token_required
def serve_invoice_file(filename):
    """
    Serve invoice file for viewing or downloading
    Security: Only authenticated users can access files
    """
    from flask import send_from_directory
    import os
    from werkzeug.utils import secure_filename
    
    # Secure the filename to prevent directory traversal
    safe_filename = secure_filename(filename)
    
    # Invoice files directory
    invoice_dir = os.path.join(os.getcwd(), 'uploads', 'invoices')
    file_path = os.path.join(invoice_dir, safe_filename)
    
    # Security check: ensure file is within uploads directory
    real_path = os.path.realpath(file_path)
    real_upload_dir = os.path.realpath(invoice_dir)
    
    if not real_path.startswith(real_upload_dir):
        logger.warning(f"Attempted directory traversal attack: {filename}")
        return jsonify({'error': 'Invalid file path'}), 403
    
    # Check if file exists
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Determine if it's a download request
    download = request.args.get('download', 'false').lower() == 'true'
    
    try:
        return send_from_directory(
            invoice_dir,
            safe_filename,
            as_attachment=download,
            mimetype=None  # Auto-detect based on extension
        )
    except Exception as e:
        logger.error(f"Error serving invoice file {filename}: {e}")
        return jsonify({'error': 'Failed to serve file'}), 500


@app.route('/api/assets/<int:asset_id>/invoice', methods=['GET'])
@token_required
def get_asset_invoice_info(asset_id):
    """
    Get invoice attachment information for an asset
    """
    from utils.file_upload import get_invoice_file_info, get_file_url
    
    asset = Asset.query.get_or_404(asset_id)
    
    if not asset.invoice_attachment:
        return jsonify({
            'has_invoice': False,
            'invoice_attachment': None
        })
    
    file_info = get_invoice_file_info(asset.invoice_attachment)
    
    if file_info['exists']:
        file_info['view_url'] = get_file_url(asset.invoice_attachment)
        file_info['download_url'] = get_file_url(asset.invoice_attachment) + '?download=true'
    
    return jsonify({
        'has_invoice': file_info['exists'],
        'invoice_attachment': file_info
    })
'''

print("Invoice attachment endpoints code:")
print(endpoint_code)
print("\n" + "="*80)
print("Copy the above code and add it to api_server.py before the main block")
print("="*80)
