import sqlite3
import random
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext

# --- PASSWORD HASHING SETUP ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)
# ------------------------------

def create_mock_data():
    os.makedirs('data', exist_ok=True)
    
    db_path = 'data/fotherbys.db'
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        print("Please run 'python scripts/setup_database.py' first.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"Connected to {db_path}...")
    
    # Clear existing data safely
    try:
        cursor.execute("DELETE FROM transactions")
        cursor.execute("DELETE FROM lot_images")
        cursor.execute("DELETE FROM lots")
        cursor.execute("DELETE FROM auctions")
        cursor.execute("DELETE FROM clients")
        # cursor.execute("DELETE FROM sqlite_sequence") 
        print("Existing data cleared.")
    except sqlite3.OperationalError as e:
        print(f"Database Error: {e}")
        return
    
    # CLIENTS
    admin_pass = get_password_hash("admin123")
    seller_pass = get_password_hash("seller123")
    buyer_pass = get_password_hash("buyer123")

    # Format: (Title, First, Last, FullName, Address, Email, Phone, Type, AccNo, Sort, PassHash, Staff, Approved)
    clients_data = [
        ("Mr", "Admin", "Staff", "Admin Staff", "Fotherbys HQ", "admin@fotherbys.com", "000", "Joint", "10101010", "00-00-01", admin_pass, 1, 1),
        ("Lady", "Margaret", "Thornbury", "Lady Margaret Thornbury", "15 Belgrave Square, London SW1X 8PS", "m.thornbury@example.com", "+44 20 7235 8000", "Seller", "12345678", "20-40-60", seller_pass, 0, 1),
        ("Sir", "Robert", "Ashford", "Sir Robert Ashford", "Ashford Manor, Cotswolds GL54 1NN", "r.ashford@example.com", "+44 1451 820123", "Seller", "87654321", "40-30-20", seller_pass, 0, 1),
        ("Mr", "James", "Wellington", "James Wellington III", "432 Park Avenue, New York, NY 10022", "j.wellington@example.com", "+1 212 555 0198", "Buyer", "11223344", "10-10-10", buyer_pass, 0, 0),
        ("Madame", "Élise", "Dubois", "Madame Élise Dubois", "8 Avenue Montaigne, 75008 Paris", "e.dubois@example.com", "+33 1 53 67 89 00", "Seller", "55667788", "30-30-30", seller_pass, 0, 1),
        ("Mr", "Chen", "Wei", "Mr. Chen Wei", "88 Nathan Road, Kowloon, Hong Kong", "c.wei@example.com", "+852 2123 4567", "Buyer", "", "", buyer_pass, 0, 1),
        ("Lady", "Victoria", "Pembroke", "Lady Victoria Pembroke", "Pembroke Manor, Hampshire", "victoria@pembroke-estate.co.uk", "+44 20 7946 0958", "Seller", "99887766", "11-22-33", seller_pass, 0, 1),
        ("Count", "Alessandro", "di Medici", "Count Alessandro di Medici", "Palazzo Medici, Florence", "alessandro@medici-collection.it", "+39 055 123 4567", "Seller", "66554433", "44-55-66", seller_pass, 0, 1),
        ("Mrs", "Charlotte", "Whitmore", "Mrs. Charlotte Whitmore", "Upper East Side, New York", "charlotte@whitmore-gallery.com", "+1 212 555 0123", "Seller", "22334455", "77-88-99", seller_pass, 0, 1),
        ("Sir", "Henry", "Ashford", "Sir Henry Ashford", "Ashford Hall, Yorkshire", "henry@ashford-holdings.co.uk", "+44 20 7946 1234", "Seller", "99001122", "99-00-11", seller_pass, 0, 1),
    ]
    
    client_ids_map = {} 

    for idx, c in enumerate(clients_data):
        cursor.execute("""
            INSERT INTO clients (
                title, first_name, last_name, name, address, email, phone, 
                client_type, bank_account_number, bank_sort_code, password_hash, is_staff, is_approved
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, c)
        client_ids_map[idx] = cursor.lastrowid
    
    buyer_ids = [client_ids_map[3], client_ids_map[5], client_ids_map[0]] # James, Chen, Admin
    admin_id = client_ids_map[0]

    # AUCTIONS DATA 
    auctions_data = [
        ("21st Century British Art", "London", (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Contemporary British artists including landscapes and portraits"),
        ("Post-War European Masters", "Paris", (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Major works from post-war European artists"),
        ("Modern American Art", "New York", (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"), "2:00pm", "Physical", "Significant American artworks from 1950-2000"),
        ("Online Fine Art Sale", "London", (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"), "9:30am", "Online", "Accessible fine art for emerging collectors"),
        # PAST AUCTIONS
        ("Impressionist & Modern Art", "London", (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Evening sale of impressionist masterpieces"),
        ("Contemporary Sculpture", "Paris", (datetime.now() - timedelta(days=45)).strftime("%Y-%m-%d"), "2:00pm", "Physical", "Three-dimensional artworks by leading sculptors"),
    ]
    
    auction_ids = []
    for auction in auctions_data:
        cursor.execute("""
            INSERT INTO auctions (title, location, auction_date, start_time, auction_type, theme)
            VALUES (?, ?, ?, ?, ?, ?)
        """, auction)
        auction_ids.append(cursor.lastrowid)
        
    past_auction_ids = [auction_ids[4], auction_ids[5]] # Capture IDs for logic later
    
    # LOTS DATA
    paintings = [
        { "title": "Coastal Morning Light", "artist": "David Hockney", "year": 2018, "category": "Painting", "subject": "Seascape", "medium": "Oil", "framed": True, "height": 120, "width": 150, "description": "A stunning depiction of early morning light reflecting off calm coastal waters.", "estimate_low": 45000, "estimate_high": 65000, "reserve": 42000, "seller_idx": 0 },
        { "title": "Urban Fragments", "artist": "Banksy", "year": 2020, "category": "Painting", "subject": "Abstract", "medium": "Acrylic", "framed": True, "height": 100, "width": 100, "description": "A provocative commentary on modern urban life.", "estimate_low": 85000, "estimate_high": 120000, "reserve": 80000, "seller_idx": 2 },
        { "title": "Summer Garden", "artist": "Joan Miró", "year": 1965, "category": "Painting", "subject": "Landscape", "medium": "Oil", "framed": True, "height": 80, "width": 100, "description": "Vibrant garden scene.", "estimate_low": 150000, "estimate_high": 200000, "reserve": 145000, "seller_idx": 4 },
        { "title": "Portrait of a Lady", "artist": "Lucian Freud", "year": 1995, "category": "Painting", "subject": "Portrait", "medium": "Watercolour", "framed": True, "height": 60, "width": 50, "description": "Intimate portrait.", "estimate_low": 12000, "estimate_high": 18000, "reserve": 11000, "seller_idx": 9 },
    ]
    drawings = [
        { "title": "Study of Hands", "artist": "Lucian Freud", "year": 1988, "category": "Drawing", "subject": "Figure", "medium": "Charcoal", "framed": True, "height": 42, "width": 30, "description": "Detailed anatomical study.", "estimate_low": 8500, "estimate_high": 12000, "reserve": 8000, "seller_idx": 0 },
        { "title": "Architectural Sketch", "artist": "David Hockney", "year": 2015, "category": "Drawing", "subject": "Landscape", "medium": "Pencil", "framed": False, "height": 29, "width": 42, "description": "Quick observational sketch.", "estimate_low": 15000, "estimate_high": 22000, "reserve": 14000, "seller_idx": 6 },
        { "title": "Abstract Composition", "artist": "Wassily Kandinsky", "year": 1923, "category": "Drawing", "subject": "Abstract", "medium": "Ink", "framed": True, "height": 35, "width": 50, "description": "Pioneering abstract work.", "estimate_low": 18000, "estimate_high": 25000, "reserve": 17000, "seller_idx": 6 },
    ]
    sculptures = [
        { "title": "Abstract Form No. 7", "artist": "Henry Moore", "year": 1972, "category": "Sculpture", "subject": "Abstract", "material": "Bronze", "height": 85, "length": 60, "width": 40, "weight": 125, "description": "Monumental bronze sculpture.", "estimate_low": 220000, "estimate_high": 280000, "reserve": 210000, "seller_idx": 9 },
        { "title": "Reclining Figure", "artist": "Barbara Hepworth", "year": 1968, "category": "Sculpture", "subject": "Figure", "material": "Marble", "height": 45, "length": 90, "width": 35, "weight": 180, "description": "Elegant marble sculpture.", "estimate_low": 180000, "estimate_high": 240000, "reserve": 175000, "seller_idx": 2 },
        { "title": "Dancing Figure", "artist": "Auguste Rodin", "year": 1905, "category": "Sculpture", "subject": "Figure", "material": "Bronze", "height": 35, "length": 20, "width": 18, "weight": 8, "description": "Small bronze study.", "estimate_low": 65000, "estimate_high": 85000, "reserve": 62000, "seller_idx": 1 },
        { "title": "Modern Torso", "artist": "Antony Gormley", "year": 2010, "category": "Sculpture", "subject": "Figure", "material": "Pewter", "height": 55, "length": 30, "width": 25, "weight": 15, "description": "Contemporary interpretation.", "estimate_low": 16000, "estimate_high": 22000, "reserve": 15000, "seller_idx": 4 },
    ]
    photographs = [
        { "title": "Urban Landscape #12", "artist": "Andreas Gursky", "year": 2019, "category": "Photography", "subject": "Landscape", "image_type": "Colour", "height": 120, "width": 180, "description": "Large-scale photograph.", "estimate_low": 35000, "estimate_high": 45000, "reserve": 33000, "seller_idx": 8 },
        { "title": "Portrait Series III", "artist": "Annie Leibovitz", "year": 2017, "category": "Photography", "subject": "Portrait", "image_type": "Black and White", "height": 76, "width": 60, "description": "Striking black and white portrait.", "estimate_low": 18000, "estimate_high": 25000, "reserve": 17000, "seller_idx": 7 },
    ]
    carvings = [
        { "title": "Forest Spirit", "artist": "Grinling Gibbons", "year": 1680, "category": "Carving", "subject": "Figure", "material": "Oak", "height": 65, "length": 45, "width": 30, "weight": 15, "description": "Exceptional 17th-century carved oak panel.", "estimate_low": 28000, "estimate_high": 38000, "reserve": 26000, "seller_idx": 6 },
        { "title": "Celtic Cross", "artist": "Unknown", "year": 1850, "category": "Carving", "subject": "Religious", "material": "Beech", "height": 45, "length": 30, "width": 15, "weight": 8, "description": "Victorian revival carved beech cross.", "estimate_low": 5500, "estimate_high": 8000, "reserve": 5000, "seller_idx": 9 },
    ]
    
    all_lots = paintings + drawings + sculptures + photographs + carvings
    
    for idx, lot in enumerate(all_lots):
        lot_reference = f"LOT-{2024}-{idx + 100:03d}"
        
        
        if lot["category"] in ["Sculpture", "Carving"]:
            auction_id = auction_ids[5]
        
        elif lot["artist"] in ["Joan Miró", "David Hockney", "Wassily Kandinsky"]:
            auction_id = auction_ids[4]
            
        else:
            if lot["category"] == "Photography":
                auction_id = auction_ids[0] 
            elif lot["estimate_low"] < 20000:
                auction_id = auction_ids[3]
            else:
                auction_id = auction_ids[1] 
        
        
        status = "Listed"
        sold_price = None
        suggested_stream = "Online" if lot["estimate_low"] < 20000 else "Physical"
        
        medium = lot.get("medium") or lot.get("image_type")
        height = lot.get("height")
        width = lot.get("width")
        length_val = lot.get("length")
        
        db_width = width 
        db_depth = None
        if length_val:
            db_width = length_val
            db_depth = width 
        
        dimensions_str = ""
        if height:
            if db_depth:
                dimensions_str = f"{height} x {db_width} x {db_depth} cm"
            elif db_width:
                dimensions_str = f"{height} x {db_width} cm"
        
        is_framed = 1 if lot.get("framed") else 0
        material = lot.get("material")
        weight = lot.get("weight")
        subcategory = lot.get("subject")
        seller_id = client_ids_map[lot.get("seller_idx", 1)]

        cursor.execute("""
            INSERT INTO lots (
                lot_reference, artist, title, year_of_production, category, 
                description, dimensions, 
                estimate_low, estimate_high, reserve_price, 
                status, seller_id, auction_id, triage_status, sold_price,
                medium, material, weight, height, width, depth, is_framed, subcategory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lot_reference, lot["artist"], lot["title"], lot["year"], lot["category"],
            lot["description"], dimensions_str,
            lot["estimate_low"], lot["estimate_high"], lot["reserve"], 
            status, seller_id, auction_id, suggested_stream, sold_price,
            medium, material, weight, height, db_width, db_depth, is_framed, subcategory
        ))
        
        lot_id = cursor.lastrowid
        
        image_url = f"/placeholder.svg?height=800&width=600&text={lot['artist']}"
        thumbnail_url = f"/placeholder.svg?height=300&width=300&text={lot['artist']}"
        
        cursor.execute("""
            INSERT INTO lot_images (lot_id, image_url, thumbnail_url, is_primary)
            VALUES (?, ?, ?, 1)
        """, (lot_id, image_url, thumbnail_url))

    
    placeholders = ','.join('?' for _ in past_auction_ids)
    cursor.execute(f"SELECT id, seller_id, estimate_low, estimate_high, title FROM lots WHERE auction_id IN ({placeholders})", past_auction_ids)
    
    past_lots_rows = list(cursor.fetchall())
    random.shuffle(past_lots_rows)
    
    to_sell_count = int(len(past_lots_rows) * 0.8)
    
    for i in range(to_sell_count):
        target_lot = past_lots_rows[i]
        lid, sid, low, high, title = target_lot
        
       
        valid_buyers = [b for b in buyer_ids if b != sid]
        if not valid_buyers: continue
        buyer_id = random.choice(valid_buyers)
        
        
        hammer = round(random.uniform(low, high * 1.1), 2) # Sometimes goes over estimate
        prem = round(hammer * 0.10, 2)
        comm = round(hammer * 0.20, 2)
        
        
        cursor.execute("""
            INSERT INTO transactions (lot_id, buyer_id, seller_id, hammer_price, buyers_premium, sellers_commission, total_buyer_pays, total_seller_receives) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (lid, buyer_id, sid, hammer, prem, comm, hammer+prem, hammer-comm))
        
        
        cursor.execute("UPDATE lots SET status = 'Sold', sold_price = ? WHERE id = ?", (hammer, lid))
        print(f"-> Sold Lot {lid} ({title}) for {hammer}")

    
    for i in range(to_sell_count, len(past_lots_rows)):
        lid = past_lots_rows[i][0]
        cursor.execute("UPDATE lots SET status = 'Unsold' WHERE id = ?", (lid,))

    conn.commit()
    conn.close()
    
    print(f" Mock data created successfully in {db_path}!")
    print(f"   - {len(clients_data)} clients")
    print(f"   - {len(auctions_data)} auctions")
    print(f"   - {len(all_lots)} lots total")

if __name__ == "__main__":
    create_mock_data()