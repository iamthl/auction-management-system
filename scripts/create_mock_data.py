import sqlite3
import random
import os
from datetime import datetime, timedelta

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
    except sqlite3.OperationalError as e:
        print(f"Database Error: {e}")
        return
    
    # Create clients
    # Note: Added password_hash and mapped client_status to client_type
    clients_data = [
        ("Lady Margaret Thornbury", "15 Belgrave Square, London SW1X 8PS", "m.thornbury@example.com", "+44 20 7235 8000", "Seller", "GB29 NWBK 6016 1331 9268 19"),
        ("Sir Robert Ashford", "Ashford Manor, Cotswolds GL54 1NN", "r.ashford@example.com", "+44 1451 820123", "Seller", "GB94 BARC 2004 0386 5432 10"),
        ("James Wellington III", "432 Park Avenue, New York, NY 10022", "j.wellington@example.com", "+1 212 555 0198", "Buyer", "US64 SVBK US6S 0000 0123 4567 890"),
        ("Madame Élise Dubois", "8 Avenue Montaigne, 75008 Paris", "e.dubois@example.com", "+33 1 53 67 89 00", "Seller", "FR14 2004 1010 0505 0001 3M02 606"),
        ("Mr. Chen Wei", "88 Nathan Road, Kowloon, Hong Kong", "c.wei@example.com", "+852 2123 4567", "Buyer", ""),
    ]
    
    for client in clients_data:
        cursor.execute("""
            INSERT INTO clients (name, address, email, phone, client_type, bank_details, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, 'hashed_pass')
        """, client)
    
    # Create auctions
    auctions_data = [
        ("21st Century British Art", "London", (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Contemporary British artists including landscapes and portraits"),
        ("Post-War European Masters", "Paris", (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Major works from post-war European artists"),
        ("Modern American Art", "New York", (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"), "2:00pm", "Physical", "Significant American artworks from 1950-2000"),
        ("Online Fine Art Sale", "London", (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"), "9:30am", "Online", "Accessible fine art for emerging collectors"),
        ("Impressionist & Modern Art", "London", (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"), "7:00pm", "Physical", "Evening sale of impressionist masterpieces (PAST)"),
        ("Contemporary Sculpture", "Paris", (datetime.now() - timedelta(days=45)).strftime("%Y-%m-%d"), "2:00pm", "Physical", "Three-dimensional artworks by leading sculptors (PAST)"),
    ]
    
    auction_ids = []
    for auction in auctions_data:
        cursor.execute("""
            INSERT INTO auctions (title, location, auction_date, start_time, auction_type, theme)
            VALUES (?, ?, ?, ?, ?, ?)
        """, auction)
        auction_ids.append(cursor.lastrowid)
    
    # Data Lists
    # PAINTINGS
    paintings = [
        {
            "title": "Coastal Morning Light", "artist": "David Hockney", "year": 2018, "category": "Painting",
            "subject": "Seascape", "medium": "Oil", "framed": True, "height": 120, "width": 150,
            "description": "A stunning depiction of early morning light reflecting off calm coastal waters.",
            "estimate_low": 45000, "estimate_high": 65000, "reserve": 42000, "seller_id": 1
        },
        {
            "title": "Urban Fragments", "artist": "Banksy", "year": 2020, "category": "Painting",
            "subject": "Abstract", "medium": "Acrylic", "framed": True, "height": 100, "width": 100,
            "description": "A provocative commentary on modern urban life, featuring Banksy's signature stencil technique.",
            "estimate_low": 85000, "estimate_high": 120000, "reserve": 80000, "seller_id": 2
        },
        {
            "title": "Summer Garden", "artist": "Joan Miró", "year": 1965, "category": "Painting",
            "subject": "Landscape", "medium": "Oil", "framed": True, "height": 80, "width": 100,
            "description": "Vibrant garden scene with Miró's characteristic biomorphic forms and brilliant primary colors.",
            "estimate_low": 150000, "estimate_high": 200000, "reserve": 145000, "seller_id": 4
        },
        {
            "title": "Portrait of a Lady", "artist": "Lucian Freud", "year": 1995, "category": "Painting",
            "subject": "Portrait", "medium": "Watercolour", "framed": True, "height": 60, "width": 50,
            "description": "Intimate portrait demonstrating Freud's psychological intensity.",
            "estimate_low": 12000, "estimate_high": 18000, "reserve": 11000, "seller_id": 1
        },
    ]
    
    # DRAWINGS
    drawings = [
        {
            "title": "Study of Hands", "artist": "Lucian Freud", "year": 1988, "category": "Drawing",
            "subject": "Figure", "medium": "Charcoal", "framed": True, "height": 42, "width": 30,
            "description": "Detailed anatomical study showcasing Freud's exceptional draftsmanship.",
            "estimate_low": 8500, "estimate_high": 12000, "reserve": 8000, "seller_id": 2
        },
        {
            "title": "Architectural Sketch", "artist": "David Hockney", "year": 2015, "category": "Drawing",
            "subject": "Landscape", "medium": "Pencil", "framed": False, "height": 29, "width": 42,
            "description": "Quick observational sketch of California architecture.",
            "estimate_low": 15000, "estimate_high": 22000, "reserve": 14000, "seller_id": 1
        },
        {
            "title": "Abstract Composition", "artist": "Wassily Kandinsky", "year": 1923, "category": "Drawing",
            "subject": "Abstract", "medium": "Ink", "framed": True, "height": 35, "width": 50,
            "description": "Pioneering abstract work exploring the relationship between form and color.",
            "estimate_low": 18000, "estimate_high": 25000, "reserve": 17000, "seller_id": 4
        },
    ]
    
    # SCULPTURES
    sculptures = [
        {
            "title": "Abstract Form No. 7", "artist": "Henry Moore", "year": 1972, "category": "Sculpture",
            "subject": "Abstract", "material": "Bronze", "height": 85, "length": 60, "width": 40, "weight": 125,
            "description": "Monumental bronze sculpture exploring Moore's fascination with organic forms.",
            "estimate_low": 220000, "estimate_high": 280000, "reserve": 210000, "seller_id": 4
        },
        {
            "title": "Reclining Figure", "artist": "Barbara Hepworth", "year": 1968, "category": "Sculpture",
            "subject": "Figure", "material": "Marble", "height": 45, "length": 90, "width": 35, "weight": 180,
            "description": "Elegant marble sculpture demonstrating Hepworth's mastery of form.",
            "estimate_low": 180000, "estimate_high": 240000, "reserve": 175000, "seller_id": 2
        },
        {
            "title": "Dancing Figure", "artist": "Auguste Rodin", "year": 1905, "category": "Sculpture",
            "subject": "Figure", "material": "Bronze", "height": 35, "length": 20, "width": 18, "weight": 8,
            "description": "Small bronze study capturing movement and emotion.",
            "estimate_low": 65000, "estimate_high": 85000, "reserve": 62000, "seller_id": 1
        },
        {
            "title": "Modern Torso", "artist": "Antony Gormley", "year": 2010, "category": "Sculpture",
            "subject": "Figure", "material": "Pewter", "height": 55, "length": 30, "width": 25, "weight": 15,
            "description": "Contemporary interpretation of the human form.",
            "estimate_low": 16000, "estimate_high": 22000, "reserve": 15000, "seller_id": 2
        },
    ]
    
    # PHOTOGRAPHS
    photographs = [
        {
            "title": "Urban Landscape #12", "artist": "Andreas Gursky", "year": 2019, "category": "Photography",
            "subject": "Landscape", "image_type": "Colour", "height": 120, "width": 180,
            "description": "Large-scale photograph of urban architecture, printed on archival paper.",
            "estimate_low": 35000, "estimate_high": 45000, "reserve": 33000, "seller_id": 4
        },
        {
            "title": "Portrait Series III", "artist": "Annie Leibovitz", "year": 2017, "category": "Photography",
            "subject": "Portrait", "image_type": "Black and White", "height": 76, "width": 60,
            "description": "Striking black and white portrait from Leibovitz's celebrated series.",
            "estimate_low": 18000, "estimate_high": 25000, "reserve": 17000, "seller_id": 2
        },
    ]
    
    # CARVINGS
    carvings = [
        {
            "title": "Forest Spirit", "artist": "Grinling Gibbons", "year": 1680, "category": "Carving",
            "subject": "Figure", "material": "Oak", "height": 65, "length": 45, "width": 30, "weight": 15,
            "description": "Exceptional 17th-century carved oak panel depicting a woodland scene.",
            "estimate_low": 28000, "estimate_high": 38000, "reserve": 26000, "seller_id": 1
        },
        {
            "title": "Celtic Cross", "artist": "Unknown", "year": 1850, "category": "Carving",
            "subject": "Other", "material": "Beech", "height": 45, "length": 30, "width": 15, "weight": 8,
            "description": "Victorian revival carved beech cross with traditional Celtic knotwork patterns.",
            "estimate_low": 5500, "estimate_high": 8000, "reserve": 5000, "seller_id": 1
        },
    ]
    
    # Combine all lots
    all_lots = paintings + drawings + sculptures + photographs + carvings
    
    for idx, lot in enumerate(all_lots):
        # Generate Lot Reference
        lot_reference = f"LOT-{2024}-{idx + 100:03d}"
        
        avg_estimate = (lot["estimate_low"] + lot["estimate_high"]) / 2
        suggested_stream = "Online" if lot["estimate_low"] < 20000 else "Physical"
        
        # Assign to appropriate auction
        if lot["category"] in ["Sculpture", "Carving"]:
            if lot["estimate_low"] < 20000:
                auction_id = auction_ids[3]  # Online sale
            else:
                auction_id = auction_ids[0]  # London 
        elif lot["category"] == "Photography":
            auction_id = auction_ids[3]  # Online sale
        else:
            if lot["estimate_low"] < 20000:
                auction_id = auction_ids[3]  # Online sale
            elif lot["artist"] in ["Pablo Picasso", "Henri Matisse", "Joan Miró", "Marc Chagall", "Wassily Kandinsky"]:
                auction_id = auction_ids[1]  # Paris
            elif lot["artist"] in ["Andy Warhol", "Jackson Pollock", "Mark Rothko", "Roy Lichtenstein", "Jean-Michel Basquiat"]:
                auction_id = auction_ids[2]  # New York
            else:
                auction_id = auction_ids[0]  # London
        
        # Determine status based on auction date
        cursor.execute("SELECT auction_date FROM auctions WHERE id = ?", (auction_id,))
        auction_date_str = cursor.fetchone()[0]
        auction_dt = datetime.strptime(auction_date_str, "%Y-%m-%d")
        
        status = "Listed"
        sold_price = None
        
        if auction_dt < datetime.now():
            # Past auction
            status = "Sold" if random.random() > 0.2 else "Unsold"
            if status == "Sold":
                sold_price = int(lot["estimate_low"] + random.uniform(0, lot["estimate_high"] - lot["estimate_low"]))
        
        # Build dimensions and framing strings
        dimensions = ""
        framing_details = ""
        
        if "height" in lot and "width" in lot:
            if "length" in lot:
                dimensions = f"{lot['height']} x {lot['length']} x {lot['width']} cm"
            else:
                dimensions = f"{lot['height']} x {lot['width']} cm"
        
        if "framed" in lot:
            framing_details = "Framed" if lot['framed'] else "Unframed"
        elif "material" in lot:
            framing_details = lot["material"] 
        
        cursor.execute("""
            INSERT INTO lots (
                lot_reference, artist, title, year_of_production, category, 
                description, dimensions, framing_details,
                estimate_low, estimate_high, reserve_price, 
                status, seller_id, auction_id, triage_status, sold_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            lot_reference, lot["artist"], lot["title"], lot["year"], lot["category"],
            lot["description"], dimensions, framing_details,
            lot["estimate_low"], lot["estimate_high"], lot["reserve"], 
            status, lot["seller_id"], auction_id, suggested_stream, sold_price
        ))
        
        lot_id = cursor.lastrowid
        
        # Add placeholder images
        image_url = f"/placeholder.svg?height=800&width=600&text={lot['artist']}"
        thumbnail_url = f"/placeholder.svg?height=300&width=300&text={lot['artist']}"
        
        cursor.execute("""
            INSERT INTO lot_images (lot_id, image_url, thumbnail_url, is_primary)
            VALUES (?, ?, ?, 1)
        """, (lot_id, image_url, thumbnail_url))
    
    conn.commit()
    conn.close()
    
    print(f" Mock data created successfully in {db_path}!")
    print(f"   - {len(clients_data)} clients")
    print(f"   - {len(auctions_data)} auctions")
    print(f"   - {len(all_lots)} lots")

if __name__ == "__main__":
    create_mock_data()