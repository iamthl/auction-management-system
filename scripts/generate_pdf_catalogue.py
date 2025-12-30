from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import sqlite3
from datetime import datetime
import os

def generate_auction_catalogue_pdf(auction_id: int):    
    db_path = 'data/fotherbys.db'
    
    if not os.path.exists(db_path):
        if os.path.exists(f"../{db_path}"):
             db_path = f"../{db_path}"
             
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,))
    auction = cursor.fetchone()
    if not auction:
        raise ValueError(f"Auction {auction_id} not found")
    
    cursor.execute('''
        SELECT l.*, GROUP_CONCAT(li.image_url) as images
        FROM lots l
        LEFT JOIN lot_images li ON l.id = li.lot_id
        WHERE l.auction_id = ? AND l.status = "Listed"
        GROUP BY l.id
        ORDER BY l.lot_reference
    ''', (auction_id,))
    lots = cursor.fetchall()
    
    output_dir = "public/catalogues" # Store in public so it's accessible if needed
    os.makedirs(output_dir, exist_ok=True)
    filename = f"Fotherbys_Catalogue_{auction_id}.pdf"
    output_path = os.path.join(output_dir, filename)
    
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                           topMargin=0.75*inch, bottomMargin=0.75*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Times-Bold',
        leading=34
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        fontSize=12,
        textColor=colors.HexColor('#666666'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Times-Roman'
    )
    
    lot_title_style = ParagraphStyle(
        'LotTitle',
        fontSize=10,
        textColor=colors.HexColor('#8B7355'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    artist_style = ParagraphStyle(
        'Artist',
        fontSize=14,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=4,
        fontName='Times-Bold'
    )
    
    logo_path = "public/images/fotherbys-logo.png"
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=2*inch, height=0.6*inch)
            story.append(logo)
            story.append(Spacer(1, 0.3*inch))
        except:
            pass
    
    # Header
    story.append(Paragraph("FOTHERBY'S", title_style))
    story.append(Paragraph("Est. 1961", subtitle_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(auction['title'], title_style))
    
    date_str = auction['auction_date']
    formatted_date = datetime.strptime(date_str, '%Y-%m-%d').strftime('%d %B %Y')
    
    story.append(Paragraph(
        f"{auction['location']} • {formatted_date} • {auction['start_time']}", 
        subtitle_style
    ))
    if auction['theme']:
        story.append(Paragraph(auction['theme'], subtitle_style))
    
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("_" * 100, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Lots
    for lot in lots:
        story.append(Paragraph(f"{lot['lot_reference']}", lot_title_style))
        story.append(Paragraph(lot['artist'], artist_style))
        story.append(Paragraph(f"<i>{lot['title']}</i>", styles['Normal']))
        
        if lot['year_of_production']:
            story.append(Paragraph(f"{lot['year_of_production']}", styles['Normal']))
        
        story.append(Spacer(1, 0.1*inch))
        
        if lot['description']:
            desc_style = ParagraphStyle('Desc', parent=styles['Normal'], 
                                       fontSize=10, alignment=TA_JUSTIFY, leading=14)
            story.append(Paragraph(lot['description'], desc_style))
        
        story.append(Spacer(1, 0.15*inch))
        
        estimate_style = ParagraphStyle('Estimate', parent=styles['Normal'],
                                       fontSize=11, fontName='Helvetica-Bold')
        story.append(Paragraph(
            f"Estimate: £{lot['estimate_low']:,.0f} - £{lot['estimate_high']:,.0f}",
            estimate_style
        ))
        
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("_" * 100, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
    
    # Footer
    story.append(PageBreak())
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
                                 fontSize=8, textColor=colors.HexColor('#666666'),
                                 alignment=TA_CENTER)
    story.append(Paragraph("FOTHERBY'S AUCTION HOUSES • LONDON • PARIS • NEW YORK", footer_style))
    story.append(Paragraph("www.fotherbys.com • +44 20 7123 4567", footer_style))
    
    doc.build(story)
    conn.close()
    
    return output_path

if __name__ == '__main__':
    try:
        print(generate_auction_catalogue_pdf(1))
    except Exception as e:
        print(f"Error: {e}")