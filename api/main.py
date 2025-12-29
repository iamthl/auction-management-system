from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date, timedelta
import sqlite3
import os
import sys
from pathlib import Path
from PIL import Image
import io

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="Fotherby's Auction Management API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_db():
    conn = sqlite3.connect('data/fotherbys.db') 
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic Models
class AuctionCreate(BaseModel):
    title: str
    location: str
    auction_date: date 
    start_time: str
    auction_type: str = "Live"
    theme: Optional[str] = None

class AuctionResponse(AuctionCreate):
    id: int
    status: str
    created_at: str

class LotCreate(BaseModel):
    lot_reference: str
    artist: str
    title: str
    year_of_production: Optional[int] = None
    category: str
    dimensions: Optional[str] = None
    framing_details: Optional[str] = None
    description: Optional[str] = None
    estimate_low: float
    estimate_high: float
    reserve_price: float
    triage_status: str = "Physical"
    seller_id: Optional[int] = None

class LotResponse(LotCreate):
    id: int
    sold_price: Optional[float] = None
    withdrawal_fee: float = 0
    created_at: str
    images: List[dict] = []
    auction_title: Optional[str] = None
    auction_type: Optional[str] = None
    location: Optional[str] = None
    auction_date: Optional[str] = None
    start_time: Optional[str] = None
    subject: Optional[str] = None 

class CommissionCalculation(BaseModel):
    hammer_price: float
    buyers_premium_rate: float = 0.10
    sellers_commission_rate: float = 0.10

# API Endpoints

@app.get("/")
def read_root():
    return {"message": "Fotherby's Auction Management API", "version": "1.0.0"}

# AUCTION ENDPOINTS
@app.post("/api/auctions", response_model=AuctionResponse)
def create_auction(auction: AuctionCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO auctions (title, location, auction_date, start_time, auction_type, theme)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (auction.title, auction.location, str(auction.auction_date), auction.start_time, auction.auction_type, auction.theme))
    db.commit()
    
    auction_id = cursor.lastrowid
    cursor.execute('SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE id = ?', (auction_id,))
    row = cursor.fetchone()
    return dict(row)

@app.get("/api/auctions", response_model=List[AuctionResponse])
def get_auctions(status: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = 'SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE 1=1'
    params = []
    
    if status:
        if status == "Upcoming":
            query += ' AND auction_date >= date("now")'
        elif status == "Completed":
            query += ' AND auction_date < date("now")'
    
    query += ' ORDER BY auction_date DESC'
    cursor.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

@app.get("/api/auctions/{auction_id}", response_model=AuctionResponse)
def get_auction(auction_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE id = ?', (auction_id,))
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Auction not found")
    return dict(result)

@app.post("/api/auctions/{auction_id}/generate-pdf")
def generate_auction_pdf(auction_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Generate PDF catalogue for an auction"""
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,))
    auction = cursor.fetchone()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    from scripts.generate_pdf_catalogue import generate_auction_catalogue_pdf
    
    try:
        pdf_path = generate_auction_catalogue_pdf(auction_id)
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"Fotherbys_Catalogue_{auction_id}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LOT ENDPOINTS
@app.get("/api/lots/suggest-triage")
def suggest_triage(estimate_low: float):
    """Automatically suggest Online for items under £20,000, Physical for higher"""
    suggested = "Online" if estimate_low < 20000 else "Physical"
    reason = f"Items under £20,000 typically go to Online stream. This item's lower estimate is £{estimate_low:,.0f}."
    return {"suggested_triage": suggested, "reason": reason}

@app.post("/api/lots", response_model=LotResponse)
def create_lot(lot: LotCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO lots (lot_reference, artist, title, year_of_production, category, description,
                         dimensions, framing_details, estimate_low, estimate_high, reserve_price, 
                         triage_status, seller_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending")
    ''', (lot.lot_reference, lot.artist, lot.title, lot.year_of_production, lot.category, 
          lot.description, lot.dimensions, lot.framing_details, lot.estimate_low, 
          lot.estimate_high, lot.reserve_price, lot.triage_status, lot.seller_id))
    db.commit()
    
    lot_id = cursor.lastrowid
    cursor.execute('SELECT * FROM lots WHERE id = ?', (lot_id,))
    result = cursor.fetchone()
    lot_dict = dict(result)
    lot_dict['images'] = []
    return lot_dict

@app.get("/api/lots", response_model=List[LotResponse])
def get_lots(
    auction_id: Optional[int] = None,
    status: Optional[str] = None,
    artist: Optional[str] = None,
    category: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    query = '''
        SELECT l.*, a.title as auction_title, a.auction_type, a.location, a.auction_date, a.start_time
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        WHERE 1=1
    '''
    params = []
    
    if auction_id:
        query += ' AND l.auction_id = ?'
        params.append(auction_id)
    if status:
        query += ' AND l.status = ?'
        params.append(status)
    if artist:
        query += ' AND l.artist LIKE ?'
        params.append(f'%{artist}%')
    if category:
        query += ' AND l.category = ?'
        params.append(category)
    
    query += ' ORDER BY l.id DESC'
    cursor.execute(query, params)
    results = cursor.fetchall()
    
    lots = []
    for row in results:
        lot = dict(row)
        cursor.execute('SELECT * FROM lot_images WHERE lot_id = ? ORDER BY display_order', (lot['id'],))
        lot['images'] = [dict(img) for img in cursor.fetchall()]
        lots.append(lot)
    
    return lots

@app.get("/api/lots/{lot_id}", response_model=LotResponse)
def get_lot(lot_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('''
        SELECT l.*, a.title as auction_title, a.auction_type, a.location, a.auction_date, a.start_time
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        WHERE l.id = ?
    ''', (lot_id,))
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    lot = dict(result)
    cursor.execute('SELECT * FROM lot_images WHERE lot_id = ? ORDER BY display_order', (lot_id,))
    lot['images'] = [dict(img) for img in cursor.fetchall()]
    
    return lot

@app.put("/api/lots/{lot_id}/assign-auction")
def assign_lot_to_auction(lot_id: int, auction_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('UPDATE lots SET auction_id = ?, status = "Listed" WHERE id = ?', (auction_id, lot_id))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Lot not found")
    return {"message": "Lot assigned successfully"}

@app.put("/api/lots/{lot_id}/withdraw")
def withdraw_lot(lot_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT l.*, a.auction_date 
        FROM lots l 
        LEFT JOIN auctions a ON l.auction_id = a.id 
        WHERE l.id = ?
    ''', (lot_id,))
    lot = cursor.fetchone()
    
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    
    withdrawal_fee = 0
    if lot['auction_date']:
        auction_date = datetime.strptime(lot['auction_date'], '%Y-%m-%d').date()
        days_until_auction = (auction_date - date.today()).days
        
        if days_until_auction < 14:
            withdrawal_fee = lot['estimate_low'] * 0.05
    
    cursor.execute('''
        UPDATE lots 
        SET status = ?, withdrawn_date = ?, withdrawal_fee = ?
        WHERE id = ?
    ''', ('Withdrawn', date.today(), withdrawal_fee, lot_id))
    db.commit()
    
    return {
        "message": "Lot withdrawn successfully",
        "withdrawal_fee": withdrawal_fee
    }

@app.post("/api/lots/{lot_id}/images")
async def upload_lot_image(
    lot_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    db: sqlite3.Connection = Depends(get_db)
):
    upload_dir = Path("public/uploads/lots")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    thumb_dir = Path("public/uploads/lots/thumbnails")
    thumb_dir.mkdir(parents=True, exist_ok=True)
    
    # Save original
    file_path = upload_dir / f"{lot_id}_{file.filename}"
    content = await file.read()
    with file_path.open("wb") as f:
        f.write(content)
    
    # Generate thumbnail automatically
    try:
        image = Image.open(io.BytesIO(content))
        image.thumbnail((300, 300), Image.Resampling.LANCZOS)
        thumb_path = thumb_dir / f"{lot_id}_thumb_{file.filename}"
        image.save(thumb_path, quality=85, optimize=True)
        thumbnail_url = f"/uploads/lots/thumbnails/{lot_id}_thumb_{file.filename}"
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        thumbnail_url = None
    
    cursor = db.cursor()
    image_url = f"/uploads/lots/{lot_id}_{file.filename}"
    cursor.execute('''
        INSERT INTO lot_images (lot_id, image_url, thumbnail_url, is_primary)
        VALUES (?, ?, ?, ?)
    ''', (lot_id, image_url, thumbnail_url, is_primary))
    db.commit()
    
    return {"message": "Image uploaded", "url": image_url, "thumbnail_url": thumbnail_url}

@app.post("/api/lots/{lot_id}/complete-sale")
def complete_sale(lot_id: int, hammer_price: float, db: sqlite3.Connection = Depends(get_db)):
    """Complete sale and auto-calculate all commissions"""
    buyers_premium = hammer_price * 0.10
    sellers_commission = hammer_price * 0.10
    total_buyer_pays = hammer_price + buyers_premium
    total_seller_receives = hammer_price - sellers_commission
    
    cursor = db.cursor()
    cursor.execute('UPDATE lots SET status = "Sold", sold_price = ? WHERE id = ?', (hammer_price, lot_id))
    db.commit()
    
    return {
        "message": "Sale completed",
        "hammer_price": hammer_price,
        "buyers_premium": buyers_premium,
        "total_buyer_pays": total_buyer_pays,
        "sellers_commission": sellers_commission,
        "total_seller_receives": total_seller_receives
    }

@app.post("/api/calculate-commission")
def calculate_commission(calc: CommissionCalculation):
    buyers_premium = calc.hammer_price * calc.buyers_premium_rate
    sellers_commission = calc.hammer_price * calc.sellers_commission_rate
    return {
        "hammer_price": calc.hammer_price,
        "buyers_premium": buyers_premium,
        "total_buyer_pays": calc.hammer_price + buyers_premium,
        "sellers_commission": sellers_commission,
        "total_seller_receives": calc.hammer_price - sellers_commission
    }

@app.get("/api/catalogue/search")
def search_catalogue(
    q: Optional[str] = None,
    location: Optional[str] = None,
    auction_type: Optional[str] = None,
    category: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    query = '''
        SELECT l.*, a.title as auction_title, a.auction_type, a.location, a.auction_date, a.start_time
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        WHERE l.status = "Listed"
    '''
    params = []
    
    if q:
        query += ' AND (l.artist LIKE ? OR l.title LIKE ? OR l.description LIKE ?)'
        term = f'%{q}%'
        params.extend([term, term, term])
    
    if location:
        query += ' AND a.location = ?'
        params.append(location)
    
    if auction_type:
        query += ' AND a.auction_type = ?'
        params.append(auction_type)
    
    if category:
        query += ' AND l.category = ?'
        params.append(category)
    
    query += ' ORDER BY a.auction_date ASC'
    cursor.execute(query, params)
    
    lots = []
    for row in cursor.fetchall():
        lot = dict(row)
        cursor.execute('SELECT * FROM lot_images WHERE lot_id = ?', (lot['id'],))
        lot['images'] = [dict(img) for img in cursor.fetchall()]
        lots.append(lot)
    
    return lots

@app.get("/api/categories")
def get_categories(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('SELECT DISTINCT category FROM lots WHERE category IS NOT NULL ORDER BY category')
    return [row[0] for row in cursor.fetchall()]

@app.get("/api/clients/{client_id}/lots", response_model=List[LotResponse])
def get_client_lots(client_id: int, db: sqlite3.Connection = Depends(get_db)):
    return get_lots(seller_id=client_id, db=db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)