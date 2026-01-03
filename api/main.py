from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, timedelta
import sqlite3
import os
import sys
from pathlib import Path
from PIL import Image
import io
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# Setup paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Security Config 
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

app = FastAPI(title="Fotherby's Auction Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HELPERS

def get_db():
    BASE_DIR = Path(__file__).resolve().parent.parent
    DB_PATH = BASE_DIR / "data" / "fotherbys.db"
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Database Migration 
@app.on_event("startup")
def startup_event():
    BASE_DIR = Path(__file__).resolve().parent.parent
    DB_PATH = BASE_DIR / "data" / "fotherbys.db"
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE auctions ADD COLUMN is_archived INTEGER DEFAULT 0")
        conn.commit()
        print("Migrated auctions table: Added is_archived column.")
    except sqlite3.OperationalError:
        pass 

    try:
        cursor.execute("ALTER TABLE lots ADD COLUMN is_archived INTEGER DEFAULT 0")
        conn.commit()
        print("Migrated lots table: Added is_archived column.")
    except sqlite3.OperationalError:
        pass 
        
    conn.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: sqlite3.Connection = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    cursor = db.cursor()
    cursor.execute("SELECT * FROM clients WHERE email = ?", (email,))
    user = cursor.fetchone()
    if user is None:
        raise credentials_exception
    return dict(user)

# MODELS

class AuctionCreate(BaseModel):
    title: str
    location: str
    auction_date: date 
    start_time: str
    auction_type: str = "Physical"
    theme: Optional[str] = None

class AuctionUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    auction_date: Optional[date] = None
    start_time: Optional[str] = None
    auction_type: Optional[str] = None
    theme: Optional[str] = None

class AuctionResponse(AuctionCreate):
    id: int
    status: str
    created_at: str
    is_archived: Optional[bool] = False

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

class LotUpdate(BaseModel):
    lot_reference: Optional[str] = None
    artist: Optional[str] = None
    title: Optional[str] = None
    year_of_production: Optional[int] = None
    category: Optional[str] = None
    dimensions: Optional[str] = None
    framing_details: Optional[str] = None
    description: Optional[str] = None
    estimate_low: Optional[float] = None
    estimate_high: Optional[float] = None
    reserve_price: Optional[float] = None
    triage_status: Optional[str] = None

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
    status: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    is_staff: bool
    name: str
    email: Optional[str] = None

class ClientRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    client_type: str = "Buyer" 

class CommissionCalculation(BaseModel):
    hammer_price: float
    buyers_premium_rate: float = 0.10
    sellers_commission_rate: float = 0.10

# ENDPOINTS

@app.get("/")
def read_root():
    return {"message": "Fotherby's Auction Management API", "version": "1.0.0"}

# AUTH
@app.post("/api/auth/register", response_model=Token)
def register(client: ClientRegister, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM clients WHERE email = ?", (client.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(client.password)
    cursor.execute('''
        INSERT INTO clients (name, email, password_hash, phone, address, client_type, is_staff)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    ''', (client.name, client.email, hashed_password, client.phone, client.address, client.client_type))
    db.commit()
    
    access_token = create_access_token(data={"sub": client.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_type": client.client_type,
        "is_staff": False,
        "name": client.name,
        "email": client.email
    }

@app.post("/api/auth/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM clients WHERE email = ?", (form_data.username,))
    user = cursor.fetchone()
    
    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = dict(user)
    access_token = create_access_token(data={"sub": user['email']})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_type": user['client_type'],
        "is_staff": bool(user['is_staff']),
        "name": user['name'],
        "email": user['email']
    }

@app.get("/api/users/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    user_safe = current_user.copy()
    del user_safe['password_hash']
    return user_safe

# AUCTIONS
@app.post("/api/auctions", response_model=AuctionResponse)
def create_auction(
    auction: AuctionCreate, 
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can create auctions")
        
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO auctions (title, location, auction_date, start_time, auction_type, theme, is_archived)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    ''', (auction.title, auction.location, str(auction.auction_date), auction.start_time, auction.auction_type, auction.theme))
    db.commit()
    
    auction_id = cursor.lastrowid
    cursor.execute('SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE id = ?', (auction_id,))
    return dict(cursor.fetchone())

@app.get("/api/auctions", response_model=List[AuctionResponse])
def get_auctions(
    status: Optional[str] = None, 
    archived_only: bool = False, 
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    query = 'SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE 1=1'
    params = []
    
    if archived_only:
        query += ' AND is_archived = 1'
    else:
        query += ' AND (is_archived = 0 OR is_archived IS NULL)'

    if status and not archived_only:
        if status == "Upcoming": query += ' AND auction_date >= date("now")'
        elif status == "Completed": query += ' AND auction_date < date("now")'
    
    query += ' ORDER BY auction_date DESC'
    cursor.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

@app.get("/api/auctions/{auction_id}", response_model=AuctionResponse)
def get_auction(auction_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE id = ?', (auction_id,))
    result = cursor.fetchone()
    if not result: raise HTTPException(status_code=404, detail="Auction not found")
    return dict(result)

@app.put("/api/auctions/{auction_id}", response_model=AuctionResponse)
def update_auction(
    auction_id: int,
    auction_update: AuctionUpdate,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can update auctions")
    
    cursor = db.cursor()
    cursor.execute("SELECT * FROM auctions WHERE id = ?", (auction_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Auction not found")

    update_data = auction_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
    values = list(update_data.values()) + [auction_id]
    
    cursor.execute(f"UPDATE auctions SET {set_clause} WHERE id = ?", values)
    db.commit()
    
    cursor.execute('SELECT *, CASE WHEN auction_date >= date("now") THEN "Upcoming" ELSE "Completed" END as status FROM auctions WHERE id = ?', (auction_id,))
    return dict(cursor.fetchone())

@app.delete("/api/auctions/{auction_id}")
def delete_auction(
    auction_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can delete auctions")
    
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM lots WHERE auction_id = ?", (auction_id,))
    if cursor.fetchone()[0] > 0:
        raise HTTPException(status_code=400, detail="Cannot delete auction with assigned lots. Archive it instead.")
        
    cursor.execute("DELETE FROM auctions WHERE id = ?", (auction_id,))
    db.commit()
    return {"message": "Auction deleted"}

@app.put("/api/auctions/{auction_id}/archive")
def archive_auction(
    auction_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can archive auctions")
    
    cursor = db.cursor()
    cursor.execute("UPDATE auctions SET is_archived = 1 WHERE id = ?", (auction_id,))
    db.commit()
    return {"message": "Auction archived"}

@app.put("/api/auctions/{auction_id}/unarchive")
def unarchive_auction(
    auction_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can restore auctions")
    
    cursor = db.cursor()
    cursor.execute("UPDATE auctions SET is_archived = 0 WHERE id = ?", (auction_id,))
    db.commit()
    return {"message": "Auction restored"}

@app.post("/api/auctions/{auction_id}/generate-pdf")
def generate_auction_pdf(auction_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Auction not found")
    
    try:
        from scripts.generate_pdf_catalogue import generate_auction_catalogue_pdf
        pdf_path = generate_auction_catalogue_pdf(auction_id)
        return FileResponse(pdf_path, media_type='application/pdf', filename=f"Fotherbys_Catalogue_{auction_id}.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LOTS
@app.post("/api/lots", response_model=LotResponse)
def create_lot(
    lot: LotCreate, 
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    seller_id = current_user['id'] if not current_user['is_staff'] else (lot.seller_id or current_user['id'])

    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO lots (lot_reference, artist, title, year_of_production, category, description,
                         dimensions, framing_details, estimate_low, estimate_high, reserve_price, 
                         triage_status, seller_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending")
    ''', (lot.lot_reference, lot.artist, lot.title, lot.year_of_production, lot.category, 
          lot.description, lot.dimensions, lot.framing_details, lot.estimate_low, 
          lot.estimate_high, lot.reserve_price, lot.triage_status, seller_id))
    db.commit()
    
    lot_id = cursor.lastrowid
    cursor.execute('SELECT * FROM lots WHERE id = ?', (lot_id,))
    lot_dict = dict(cursor.fetchone())
    lot_dict['images'] = []
    return lot_dict

@app.get("/api/lots/suggest-triage")
def suggest_triage(estimate_low: str = Query(..., description="Low estimate")):
    try:
        cleaned_value = float(str(estimate_low).replace(',', '').replace(' ', ''))
    except ValueError:
        return {"suggested_triage": "Physical", "reason": "Invalid estimate value provided."}
        
    suggested = "Online" if cleaned_value < 20000 else "Physical"
    reason = f"Items under £20,000 typically go to Online stream. This item's lower estimate is £{cleaned_value:,.0f}."
    return {"suggested_triage": suggested, "reason": reason}

@app.get("/api/lots", response_model=List[LotResponse])
def get_lots(
    auction_id: Optional[int] = None,
    status: Optional[str] = None,
    artist: Optional[str] = None,
    category: Optional[str] = None,
    seller_id: Optional[int] = None,
    archived_only: bool = False,
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
    
    if archived_only:
        query += ' AND l.is_archived = 1'
    else:
        query += ' AND (l.is_archived = 0 OR l.is_archived IS NULL)'

    if auction_id:
        query += ' AND l.auction_id = ?'
        params.append(auction_id)
    
    if status and not archived_only:
        query += ' AND l.status = ?'
        params.append(status)

    if artist:
        query += ' AND l.artist LIKE ?'
        params.append(f'%{artist}%')
    if category:
        query += ' AND l.category = ?'
        params.append(category)
    if seller_id:
        query += ' AND l.seller_id = ?'
        params.append(seller_id)
    
    query += ' ORDER BY l.id DESC'
    cursor.execute(query, params)
    
    lots = []
    for row in cursor.fetchall():
        lot = dict(row)
        if lot.get('is_archived'):
            lot['status'] = 'Archived'
            
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
    if not result: raise HTTPException(status_code=404, detail="Lot not found")
    
    lot = dict(result)
    if lot.get('is_archived'):
        lot['status'] = 'Archived'

    cursor.execute('SELECT * FROM lot_images WHERE lot_id = ? ORDER BY display_order', (lot_id,))
    lot['images'] = [dict(img) for img in cursor.fetchall()]
    return lot

@app.put("/api/lots/{lot_id}", response_model=LotResponse)
def update_lot(
    lot_id: int,
    lot_update: LotUpdate,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
         raise HTTPException(status_code=403, detail="Only staff can modify lots")

    cursor = db.cursor()
    update_data = lot_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
    values = list(update_data.values()) + [lot_id]
    
    try:
        cursor.execute(f"UPDATE lots SET {set_clause} WHERE id = ?", values)
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return get_lot(lot_id, db)

@app.delete("/api/lots/{lot_id}")
def delete_lot(
    lot_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can delete lots")
        
    cursor = db.cursor()
    cursor.execute("DELETE FROM lots WHERE id = ?", (lot_id,))
    db.commit()
    return {"message": "Lot deleted"}

@app.delete("/api/lots/images/{image_id}")
def delete_lot_image(
    image_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can delete images")
    
    cursor = db.cursor()
    cursor.execute("SELECT * FROM lot_images WHERE id = ?", (image_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Image not found")
    
    cursor.execute("DELETE FROM lot_images WHERE id = ?", (image_id,))
    db.commit()
    return {"message": "Image deleted"}

@app.put("/api/lots/{lot_id}/archive")
def archive_lot(
    lot_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can archive lots")
        
    cursor = db.cursor()
    cursor.execute('UPDATE lots SET is_archived = 1 WHERE id = ?', (lot_id,))
    db.commit()
    return {"message": "Lot archived"}

@app.put("/api/lots/{lot_id}/unarchive")
def unarchive_lot(
    lot_id: int,
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can restore lots")
        
    cursor = db.cursor()
    # FIX: Restore by setting is_archived to 0. Original status is preserved.
    cursor.execute('UPDATE lots SET is_archived = 0 WHERE id = ?', (lot_id,))
    db.commit()
    return {"message": "Lot restored"}

@app.get("/api/clients/{client_id}/lots", response_model=List[LotResponse])
def get_client_lots(
    client_id: int, 
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff'] and current_user['id'] != client_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return get_lots(seller_id=client_id, db=db)

@app.put("/api/lots/{lot_id}/assign-auction")
def assign_lot_to_auction(
    lot_id: int, 
    auction_id: int, 
    db: sqlite3.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can assign auctions")
        
    cursor = db.cursor()
    cursor.execute('UPDATE lots SET auction_id = ?, status = "Listed" WHERE id = ?', (auction_id, lot_id))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Lot not found")
    return {"message": "Lot assigned successfully"}

@app.put("/api/lots/{lot_id}/withdraw")
def withdraw_lot(lot_id: int, db: sqlite3.Connection = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.cursor()
    cursor.execute('SELECT * FROM lots WHERE id = ?', (lot_id,))
    lot = cursor.fetchone()
    if not lot: raise HTTPException(status_code=404, detail="Lot not found")

    if not current_user['is_staff'] and lot['seller_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    cursor.execute('UPDATE lots SET status = ?, withdrawn_date = ? WHERE id = ?', ('Withdrawn', date.today(), lot_id))
    db.commit()
    return {"message": "Lot withdrawn"}

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
    
    file_path = upload_dir / f"{lot_id}_{file.filename}"
    content = await file.read()
    with file_path.open("wb") as f:
        f.write(content)
    
    try:
        image = Image.open(io.BytesIO(content))
        image.thumbnail((300, 300), Image.Resampling.LANCZOS)
        thumb_path = thumb_dir / f"{lot_id}_thumb_{file.filename}"
        image.save(thumb_path, quality=85, optimize=True)
        thumbnail_url = f"/uploads/lots/thumbnails/{lot_id}_thumb_{file.filename}"
    except Exception:
        thumbnail_url = None
    
    cursor = db.cursor()
    image_url = f"/uploads/lots/{lot_id}_{file.filename}"
    cursor.execute('INSERT INTO lot_images (lot_id, image_url, thumbnail_url, is_primary) VALUES (?, ?, ?, ?)', 
                   (lot_id, image_url, thumbnail_url, is_primary))
    db.commit()
    return {"message": "Image uploaded", "url": image_url}

@app.post("/api/lots/{lot_id}/complete-sale")
def complete_sale(lot_id: int, hammer_price: float, db: sqlite3.Connection = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not current_user['is_staff']:
        raise HTTPException(status_code=403, detail="Only staff can finalize sales")

    cursor = db.cursor()
    cursor.execute('UPDATE lots SET status = "Sold", sold_price = ? WHERE id = ?', (hammer_price, lot_id))
    db.commit()
    
    buyers_premium = hammer_price * 0.10
    sellers_commission = hammer_price * 0.10

    return {
        "message": "Sale completed",
        "hammer_price": hammer_price,
        "total_buyer_pays": hammer_price + buyers_premium,
        "total_seller_receives": hammer_price - sellers_commission
    }

@app.post("/api/calculate-commission")
def calculate_commission(calc: CommissionCalculation):
    buyers_premium = calc.hammer_price * calc.buyers_premium_rate
    sellers_commission = calc.hammer_price * calc.sellers_commission_rate
    return {
        "hammer_price": calc.hammer_price,
        "total_buyer_pays": calc.hammer_price + buyers_premium,
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
        SELECT l.*, a.title as auction_title, a.auction_type, a.location, a.auction_date
        FROM lots l
        LEFT JOIN auctions a ON l.auction_id = a.id
        WHERE l.status = "Listed" 
        AND (l.is_archived = 0 OR l.is_archived IS NULL)
        AND (a.is_archived = 0 OR a.is_archived IS NULL)
    '''
    params = []
    
    if q:
        query += ' AND (l.artist LIKE ? OR l.title LIKE ?)'
        params.extend([f'%{q}%', f'%{q}%'])
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
        cursor.execute('SELECT * FROM lot_images WHERE lot_id = ? LIMIT 1', (lot['id'],))
        img = cursor.fetchone()
        lot['images'] = [dict(img)] if img else []
        lots.append(lot)
    return lots

@app.get("/api/categories")
def get_categories(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('SELECT DISTINCT category FROM lots WHERE category IS NOT NULL ORDER BY category')
    return [row[0] for row in cursor.fetchall()]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)