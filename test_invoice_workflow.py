#!/usr/bin/env python3
"""
Test Invoice Upload/Download Workflow
"""

from app import app, db
from models import Asset, InvoiceAttachment
import os
import tempfile

def test_invoice_workflow():
    """Test invoice operations"""
    print("="*80)
    print("WORKFLOW TEST: INVOICE OPERATIONS")
    print("="*80)
    
    with app.app_context():
        passed = 0
        failed = 0
        
        # Get an asset without invoice
        asset = Asset.query.outerjoin(InvoiceAttachment).filter(
            InvoiceAttachment.id == None
        ).first()
        
        if not asset:
            # All assets have invoices, use any asset
            asset = Asset.query.first()
            if not asset:
                print("❌ No assets for testing")
                return False
            
            # Clear existing invoice if any
            existing = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
            if existing:
                db.session.delete(existing)
                db.session.commit()
        
        print(f"\nTest Asset: ID={asset.id}, Serial={asset.serial_number}")
        
        # TEST 1: Create invoice record
        print("\n" + "-"*80)
        print("TEST 1: Create Invoice Record")
        print("-"*80)
        
        try:
            # Create test file path
            test_filename = f"invoice_test_{asset.id}.pdf"
            test_path = f"uploads/invoices/{test_filename}"
            
            invoice = InvoiceAttachment(
                asset_id=asset.id,
                stored_filename=test_filename,
                original_filename='Test_Invoice.pdf',
                storage_path=test_path,
                file_size=1024,
                mime_type='application/pdf',
                uploaded_by='test_admin'
            )
            db.session.add(invoice)
            db.session.commit()
            
            # Verify created
            created = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
            if created:
                passed += 1
                print("✅ PASS: Invoice record created")
            else:
                failed += 1
                print("❌ FAIL: Invoice not found")
            
            if created and created.stored_filename == test_filename:
                passed += 1
                print("✅ PASS: Filename correct")
            else:
                failed += 1
                print("❌ FAIL: Filename incorrect")
            
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Create failed - {str(e)}")
        
        # TEST 2: Read invoice
        print("\n" + "-"*80)
        print("TEST 2: Read Invoice")
        print("-"*80)
        
        try:
            invoice = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
            if invoice:
                passed += 1
                print(f"✅ PASS: Invoice found - {invoice.stored_filename}")
            else:
                failed += 1
                print("❌ FAIL: Invoice not found")
            
            # Test to_dict()
            if invoice:
                invoice_dict = invoice.to_dict()
                if 'filename' in invoice_dict:
                    passed += 1
                    print("✅ PASS: to_dict() works")
                else:
                    failed += 1
                    print("❌ FAIL: to_dict() missing fields")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Read failed - {str(e)}")
        
        # TEST 3: Update invoice
        print("\n" + "-"*80)
        print("TEST 3: Update Invoice")
        print("-"*80)
        
        try:
            invoice = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
            if invoice:
                invoice.original_filename = 'Updated_Invoice.pdf'
                invoice.file_size = 2048
                db.session.commit()
                
                db.session.refresh(invoice)
                if invoice.original_filename == 'Updated_Invoice.pdf':
                    passed += 1
                    print("✅ PASS: Filename updated")
                else:
                    failed += 1
                    print("❌ FAIL: Filename not updated")
                
                if invoice.file_size == 2048:
                    passed += 1
                    print("✅ PASS: File size updated")
                else:
                    failed += 1
                    print("❌ FAIL: File size not updated")
            else:
                failed += 1
                print("❌ FAIL: Invoice not found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Update failed - {str(e)}")
        
        # TEST 4: Verify unique constraint (one invoice per asset)
        print("\n" + "-"*80)
        print("TEST 4: Try Create Second Invoice for Same Asset (SHOULD FAIL)")
        print("-"*80)
        
        try:
            duplicate = InvoiceAttachment(
                asset_id=asset.id,
                stored_filename='duplicate.pdf',
                original_filename='Duplicate.pdf',
                storage_path='uploads/invoices/duplicate.pdf',
                uploaded_by='test_admin'
            )
            db.session.add(duplicate)
            db.session.commit()
            
            failed += 1
            print("❌ FAIL: Should have rejected duplicate")
            db.session.rollback()
        
        except Exception as e:
            passed += 1
            print(f"✅ PASS: Correctly rejected duplicate - {type(e).__name__}")
            db.session.rollback()
        
        # TEST 5: Delete invoice (cascade test)
        print("\n" + "-"*80)
        print("TEST 5: Delete Invoice")
        print("-"*80)
        
        try:
            invoice = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
            if invoice:
                db.session.delete(invoice)
                db.session.commit()
                
                # Verify deleted
                deleted = InvoiceAttachment.query.filter_by(asset_id=asset.id).first()
                if not deleted:
                    passed += 1
                    print("✅ PASS: Invoice deleted")
                else:
                    failed += 1
                    print("❌ FAIL: Invoice still exists")
            else:
                failed += 1
                print("❌ FAIL: Invoice not found")
        
        except Exception as e:
            failed += 1
            print(f"❌ FAIL: Delete failed - {str(e)}")
        
        print("\n" + "="*80)
        print(f"INVOICE OPERATIONS: {passed} PASS, {failed} FAIL")
        print("="*80)
        
        return failed == 0


if __name__ == '__main__':
    result = test_invoice_workflow()
    
    print("\n" + "="*80)
    print("INVOICE WORKFLOW TEST SUMMARY")
    print("="*80)
    print(f"Invoice Operations: {'PASS' if result else 'FAIL'}")
    print("="*80)
    
    exit(0 if result else 1)
