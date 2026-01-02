from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
import sqlite3
from datetime import datetime
import os
from pathlib import Path

from PIL import Image as PILImage

def get_image_path(image_url):
    if not image_url:
        return None
    
    clean_url = image_url.lstrip('/')
    
    current_dir = Path(os.getcwd())
    search_paths = [
        current_dir / "public",
        current_dir.parent / "public",
        current_dir.parent.parent / "public"
    ]
    
    for public_folder in search_paths:
        candidate = public_folder / clean_url
        if candidate.exists():
            return str(candidate)
            
    return None

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
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=4,
        fontName='Helvetica-Bold'
    )
    
    artist_style = ParagraphStyle(
        'Artist',
        fontSize=14,
        textColor=colors.HexColor('#83358F'),
        spaceAfter=4,
        fontName='Times-Bold'
    )
    
    # Logo & Header
    logo_path = "public/images/fotherbys-logo.png"
    if not os.path.exists(logo_path) and os.path.exists("../public/images/fotherbys-logo.png"):
        logo_path = "../public/images/fotherbys-logo.png"
        
    if os.path.exists(logo_path):
        try:
            logo = Image(logo_path, width=2*inch, height=0.6*inch)
            story.append(logo)
            story.append(Spacer(1, 0.3*inch))
        except:
            pass
    
    story.append(Paragraph("FOTHERBY'S", title_style))
    story.append(Paragraph("Est. 1961", subtitle_style))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(auction['title'], title_style))
    
    date_str = auction['auction_date']
    try:
        formatted_date = datetime.strptime(date_str, '%Y-%m-%d').strftime('%d %B %Y')
    except:
        formatted_date = date_str
    
    story.append(Paragraph(
        f"{auction['location']} • {formatted_date} • {auction['start_time']}", 
        subtitle_style
    ))
    if auction['theme']:
        story.append(Paragraph(auction['theme'], subtitle_style))
    
    centered_normal = ParagraphStyle('CenteredNormal', parent=styles['Normal'], alignment=TA_CENTER)
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("_" * 100, centered_normal))    
    story.append(Spacer(1, 0.3*inch))
    
    # Lots
    for lot in lots:
        text_col = []
        text_col.append(Paragraph(f"{lot['lot_reference']}", styles['Normal']))
        text_col.append(Paragraph(lot['artist'], artist_style))
        text_col.append(Paragraph(f"<i>{lot['title']}</i>", lot_title_style))
        
        if lot['year_of_production']:
            text_col.append(Paragraph(f"{lot['year_of_production']}", styles['Normal']))
        
        text_col.append(Spacer(1, 0.1*inch))
        
        if lot['description']:
            desc_style = ParagraphStyle('Desc', parent=styles['Normal'], 
                                       fontSize=10, alignment=TA_JUSTIFY, leading=14)
            # Truncate slightly if description is massive (prevent formatting breaks)
            desc_text = lot['description'][:800] + "..." if len(lot['description']) > 800 else lot['description']
            text_col.append(Paragraph(desc_text, desc_style))
        
        text_col.append(Spacer(1, 0.15*inch))
        
        estimate_style = ParagraphStyle('Estimate', parent=styles['Normal'],
                                       fontSize=11, fontName='Helvetica-Bold')
        text_col.append(Paragraph(
            f"Estimate: £{lot['estimate_low']:,.0f} - £{lot['estimate_high']:,.0f}",
            estimate_style
        ))

        img_col = []
        
        image_url = None
        if lot['images']:
            image_url = lot['images'].split(',')[0] # Take first image
            
        real_img_path = get_image_path(image_url)
        
        if real_img_path:
            try:
                pil_img = PILImage.open(real_img_path)
                img_w, img_h = pil_img.size
                aspect = img_h / float(img_w)
                
                target_width = 2.8 * inch
                target_height = target_width * aspect
                
                if target_height > 4.5 * inch:
                    target_height = 4.5 * inch
                    target_width = target_height / aspect
                    
                rl_img = Image(real_img_path, width=target_width, height=target_height)
                rl_img.hAlign = 'RIGHT'
                img_col.append(rl_img)
            except Exception as e:
                img_col.append(Spacer(1, 1))
        else:
            img_col.append(Spacer(1, 1))


        table_data = [[text_col, img_col]]
        
        t = Table(table_data, colWidths=[3.9*inch, 2.8*inch])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),      
            ('LEFTPADDING', (0,0), (-1,-1), 0),     
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        
        story.append(KeepTogether(t))
        
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("_" * 85, styles['Normal']))
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