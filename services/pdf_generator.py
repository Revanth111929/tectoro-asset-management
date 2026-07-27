"""
Asset Assignment Form PDF Generator
Generates professional PDF forms for asset assignments
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from datetime import datetime
import os
import io
import zipfile
from typing import List, Dict


class AssetAssignmentPDFGenerator:
    """Generate professional asset assignment forms"""
    
    def __init__(self, company_name="Tectoro", logo_path=None):
        self.company_name = company_name
        self.logo_path = logo_path
        self.styles = getSampleStyleSheet()
        
        # Custom styles
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=10,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=6,
            spaceBefore=8,
            fontName='Helvetica-Bold'
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=9,
            spaceAfter=4
        )
    
    def generate_assignment_form(self, asset_data: Dict, output_path: str = None) -> bytes:
        """
        Generate a single asset assignment form
        
        Args:
            asset_data: Dictionary containing asset and employee information
            output_path: Optional file path to save PDF. If None, returns bytes
            
        Returns:
            PDF as bytes if output_path is None, otherwise saves to file
        """
        # Create PDF buffer
        if output_path:
            buffer = open(output_path, 'wb')
        else:
            buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Add logo if available
        if self.logo_path and os.path.exists(self.logo_path):
            try:
                logo = Image(self.logo_path, width=1.2*inch, height=0.6*inch)
                logo.hAlign = 'CENTER'
                elements.append(logo)
                elements.append(Spacer(1, 0.1*inch))
            except:
                pass
        
        # Title
        title = Paragraph(f"<b>{self.company_name}</b>", self.title_style)
        elements.append(title)
        
        subtitle = Paragraph("ASSET ASSIGNMENT FORM", self.title_style)
        elements.append(subtitle)
        elements.append(Spacer(1, 0.15*inch))
        
        # Form Number and Date
        form_info = [
            ['Form No:', f"AAF-{asset_data.get('asset_id', 'N/A')}", 'Date:', datetime.now().strftime('%d-%m-%Y')]
        ]
        form_table = Table(form_info, colWidths=[1*inch, 1.8*inch, 0.8*inch, 1.4*inch])
        form_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.grey),
            ('TEXTCOLOR', (2, 0), (2, 0), colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ]))
        elements.append(form_table)
        elements.append(Spacer(1, 0.1*inch))
        
        # Asset Information Section
        elements.append(Paragraph("ASSET INFORMATION", self.heading_style))
        
        asset_info = [
            ['Asset ID:', asset_data.get('asset_id', 'N/A'), 'Asset Name:', asset_data.get('asset_name', 'N/A')],
            ['Category:', asset_data.get('category', 'N/A'), 'Serial Number:', asset_data.get('serial_number', 'N/A')],
            ['Model:', asset_data.get('model', 'N/A'), 'RAM:', asset_data.get('ram', 'N/A')],
            ['Storage:', asset_data.get('storage_capacity', 'N/A'), 'OS:', asset_data.get('operating_system', 'N/A')],
            ['Charger S/N:', asset_data.get('charger_serial', 'N/A'), '', ''],
        ]
        
        asset_table = Table(asset_info, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        asset_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#424242')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#424242')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(asset_table)
        elements.append(Spacer(1, 0.1*inch))
        
        # Employee Information Section
        elements.append(Paragraph("EMPLOYEE INFORMATION", self.heading_style))
        
        employee_info = [
            ['Employee ID:', asset_data.get('employee_id', 'N/A'), 'Employee Name:', asset_data.get('employee_name', 'N/A')],
            ['Department:', asset_data.get('department', 'N/A'), 'Mobile:', asset_data.get('mobile', 'N/A')],
            ['Email:', asset_data.get('email', 'N/A'), 'Location:', asset_data.get('location', 'N/A')],
        ]
        
        employee_table = Table(employee_info, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        employee_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#424242')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#424242')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(employee_table)
        elements.append(Spacer(1, 0.1*inch))
        
        # Assignment Details
        elements.append(Paragraph("ASSIGNMENT DETAILS", self.heading_style))
        
        assignment_date = asset_data.get('assignment_date', datetime.now().strftime('%d-%m-%Y'))
        if isinstance(assignment_date, str) and 'T' in assignment_date:
            assignment_date = datetime.fromisoformat(assignment_date.replace('Z', '+00:00')).strftime('%d-%m-%Y')
        
        assignment_info = [
            ['Assignment Date:', assignment_date, 'Issued By:', asset_data.get('issued_by', 'Admin')],
        ]
        
        assignment_table = Table(assignment_info, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
        assignment_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#424242')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#424242')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(assignment_table)
        elements.append(Spacer(1, 0.15*inch))
        
        # Signature Section
        elements.append(Paragraph("SIGNATURES", self.heading_style))
        
        signature_table_data = [
            ['', ''],
            ['_' * 30, '_' * 30],
            ['Employee Signature', 'Authorized Signature'],
            ['', ''],
            ['Date: _______________', 'Date: _______________']
        ]
        
        signature_table = Table(signature_table_data, colWidths=[3.2*inch, 3.2*inch])
        signature_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 3),
        ]))
        elements.append(signature_table)
        elements.append(Spacer(1, 0.15*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=7,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        footer = Paragraph(
            f"This is a system-generated document from {self.company_name} Asset Management System",
            footer_style
        )
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        
        # Return bytes or close file
        if output_path:
            buffer.close()
            return None
        else:
            pdf_bytes = buffer.getvalue()
            buffer.close()
            return pdf_bytes
    
    def generate_bulk_assignment_forms(self, assets_data: List[Dict], output_zip_path: str = None) -> bytes:
        """
        Generate multiple asset assignment forms and package them in a ZIP file
        
        Args:
            assets_data: List of dictionaries containing asset information
            output_zip_path: Optional path to save ZIP file. If None, returns bytes
            
        Returns:
            ZIP file as bytes if output_zip_path is None, otherwise saves to file
        """
        # Create ZIP buffer
        if output_zip_path:
            zip_buffer = open(output_zip_path, 'wb')
        else:
            zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for asset in assets_data:
                # Generate PDF for each asset
                pdf_bytes = self.generate_assignment_form(asset)
                
                # Create filename
                asset_id = asset.get('asset_id', 'unknown')
                asset_name = asset.get('asset_name', 'asset')
                filename = f"Assignment_Form_{asset_id}_{asset_name}.pdf".replace(' ', '_')
                
                # Add to ZIP
                zip_file.writestr(filename, pdf_bytes)
        
        # Return bytes or close file
        if output_zip_path:
            zip_buffer.close()
            return None
        else:
            zip_bytes = zip_buffer.getvalue()
            zip_buffer.close()
            return zip_bytes


def create_pdf_generator():
    """Factory function to create PDF generator instance"""
    return AssetAssignmentPDFGenerator(
        company_name="Tectoro",
        logo_path=None  # Add logo path if available
    )
