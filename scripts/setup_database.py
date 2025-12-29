import sqlite3
from datetime import datetime, timedelta
import os

def init_database():
    """Initialize SQLite database with schema for Fotherby's Auction House"""
    
    # Create database directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect('data/fotherbys.db')
    cursor = conn.cursor()
    
    # Auctions Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS auctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        location TEXT NOT NULL CHECK(location IN ('London', 'Paris', 'New York')),
        auction_date DATE NOT NULL,
        start_time TEXT NOT NULL CHECK(start_time IN ('9:30am', '2:00pm', '7:00pm')),
        theme TEXT,
        auction_type TEXT DEFAULT 'Live' CHECK(auction_type IN ('Live', 'Online')),
        status TEXT DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Completed', 'Cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Lots Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_reference TEXT UNIQUE NOT NULL,
        auction_id INTEGER,
        artist TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'Fine Art',
        dimensions TEXT,
        framing_details TEXT,
        year_of_production INTEGER,
        description TEXT,
        estimate_low REAL NOT NULL,
        estimate_high REAL NOT NULL,
        reserve_price REAL NOT NULL,
        sold_price REAL,
        commission_bids BOOLEAN DEFAULT 0,
        triage_status TEXT NOT NULL CHECK(triage_status IN ('Physical', 'Online')),
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Listed', 'Sold', 'Unsold', 'Withdrawn')),
        withdrawn_date DATE,
        withdrawal_fee REAL DEFAULT 0,
        seller_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES clients(id) ON DELETE SET NULL
    )
    ''')
    
    # Lot Images Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lot_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        is_primary BOOLEAN DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
    )
    ''')
    
    # Clients Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        bank_details TEXT,
        client_type TEXT NOT NULL CHECK(client_type IN ('Buyer', 'Seller', 'Joint')),
        is_staff BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Transactions Table (for audit trail)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER NOT NULL,
        buyer_id INTEGER,
        seller_id INTEGER NOT NULL,
        hammer_price REAL NOT NULL,
        buyers_premium REAL NOT NULL,
        sellers_commission REAL NOT NULL,
        total_buyer_pays REAL NOT NULL,
        total_seller_receives REAL NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id),
        FOREIGN KEY (buyer_id) REFERENCES clients(id),
        FOREIGN KEY (seller_id) REFERENCES clients(id)
    )
    ''')
    
    conn.commit()
    print("✓ Database schema created successfully")
    
    # Seed with sample data
    seed_data(cursor, conn)
    
    conn.close()

def seed_data(cursor, conn):
    """Seed database with comprehensive mock data"""
    
    cursor.execute('''
    INSERT OR IGNORE INTO clients (name, email, password_hash, client_type, is_staff)
    VALUES (?, ?, ?, ?, ?)
    ''', ('Admin Staff', 'admin@fotherbys.com', 'hashed_password_here', 'Joint', 1))
    
    sellers = [
        ('Lady Victoria Pembroke', 'victoria@pembroke-estate.co.uk', '+44 20 7946 0958', 'Pembroke Manor, Hampshire'),
        ('Count Alessandro di Medici', 'alessandro@medici-collection.it', '+39 055 123 4567', 'Palazzo Medici, Florence'),
        ('Mrs. Charlotte Whitmore', 'charlotte@whitmore-gallery.com', '+1 212 555 0123', 'Upper East Side, New York'),
        ('Sir Henry Ashford', 'henry@ashford-holdings.co.uk', '+44 20 7946 1234', 'Ashford Hall, Yorkshire'),
    ]
    
    for name, email, phone, address in sellers:
        cursor.execute('''
        INSERT OR IGNORE INTO clients (name, email, password_hash, phone, address, client_type)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, email, 'hashed_password', phone, address, 'Seller'))
    
    from datetime import date, timedelta
    today = date.today()
    
    auctions_data = [
        ('21st Century English Paintings', 'London', today + timedelta(days=30), '7:00pm', 'Contemporary British Art', 'Live', 'Upcoming'),
        ('Impressionist & Modern Art', 'Paris', today + timedelta(days=45), '2:00pm', 'European Masters', 'Live', 'Upcoming'),
        ('Contemporary Art Online', 'London', today + timedelta(days=15), '9:30am', 'Digital Premiere', 'Online', 'Upcoming'),
        ('Old Masters', 'New York', today + timedelta(days=60), '7:00pm', 'Renaissance to Baroque', 'Live', 'Upcoming'),
        ('Victorian & Edwardian Art', 'London', today - timedelta(days=15), '2:00pm', 'British Classics', 'Live', 'Completed'),
        ('Abstract Expressionism', 'New York', today - timedelta(days=30), '7:00pm', 'Post-War American Art', 'Live', 'Completed'),
    ]
    
    for auction in auctions_data:
        cursor.execute('''
        INSERT INTO auctions (title, location, auction_date, start_time, theme, auction_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', auction)
    
    lots_data = [
        # Upcoming Auction 1 - 21st Century English Paintings (auction_id: 1)
        ('LOT-2025-001', 1, 'David Hockney', 'Pool with Two Figures', 'Paintings', '214 x 304 cm', 'Gilt frame, museum quality glazing', 2024, 
         'A vibrant exploration of California light and form, depicting two figures beside a modernist pool.',
         180000, 250000, 180000, 'Physical', 'Listed', 2),
        ('LOT-2025-002', 1, 'Tracey Emin', 'Unmade Bed Studies', 'Mixed Media', '120 x 150 cm', 'Unframed on canvas', 2023, 
         'Mixed media work exploring themes of intimacy and vulnerability.',
         45000, 65000, 45000, 'Physical', 'Listed', 2),
        ('LOT-2025-003', 1, 'Banksy', 'Girl with Red Balloon (Print)', 'Prints', '76 x 56 cm', 'Black frame with mount', 2022, 
         'Limited edition screen print, signed and numbered by the artist. Edition of 150.',
         8000, 12000, 8000, 'Online', 'Listed', 2),
        ('LOT-2025-004', 1, 'Damien Hirst', 'The Butterfly Effect', 'Sculpture', '90 x 90 x 15 cm', 'Glass case display', 2023,
         'Butterfly wings arranged in a circular pattern, exploring themes of mortality and beauty.',
         35000, 55000, 35000, 'Physical', 'Listed', 3),
        
        # Upcoming Auction 2 - Impressionist & Modern Art (auction_id: 2)
        ('LOT-2025-005', 2, 'Claude Monet', 'Water Lilies at Giverny', 'Paintings', '100 x 150 cm', 'Original gilt frame', 1905,
         'Late period masterwork from the artist\'s Giverny series, depicting the famous Japanese bridge.',
         2500000, 3500000, 2500000, 'Physical', 'Listed', 3),
        ('LOT-2025-006', 2, 'Pablo Picasso', 'Portrait de Femme', 'Paintings', '65 x 54 cm', 'Period frame', 1937,
         'Cubist portrait from the artist\'s middle period, signed and dated lower right.',
         850000, 1200000, 850000, 'Physical', 'Listed', 3),
        ('LOT-2025-007', 2, 'Henri Matisse', 'Nu Bleu III', 'Works on Paper', '108 x 78 cm', 'Museum mount, UV glass', 1952,
         'Cut-out from the artist\'s final creative period, vibrant blue tones.',
         450000, 650000, 450000, 'Physical', 'Listed', 4),
        
        # Upcoming Auction 3 - Contemporary Art Online (auction_id: 3)
        ('LOT-2025-008', 3, 'KAWS', 'Companion (Grey)', 'Sculpture', '28 x 13 x 8 cm', 'Original box and packaging', 2020,
         'Limited edition vinyl figure, edition of 500, mint condition.',
         3500, 5500, 3500, 'Online', 'Listed', 4),
        ('LOT-2025-009', 3, 'Yayoi Kusama', 'Pumpkin (Yellow)', 'Prints', '40 x 32 cm', 'Simple black frame', 2021,
         'Silkscreen print on paper, signed and numbered 45/120.',
         6500, 9500, 6500, 'Online', 'Listed', 4),
        ('LOT-2025-010', 3, 'Takashi Murakami', 'Flower Ball (Rainbow)', 'Prints', '71 x 71 cm', 'White frame', 2019,
         'Offset lithograph with cold stamp, edition 27/300.',
         12000, 18000, 12000, 'Online', 'Listed', 5),
        
        # Upcoming Auction 4 - Old Masters (auction_id: 4)
        ('LOT-2025-011', 4, 'Rembrandt van Rijn', 'Portrait of a Gentleman', 'Paintings', '76 x 63 cm', 'Carved gilt frame, 17th century', 1645,
         'Oil on canvas, recently cleaned, excellent provenance including the Duke of Suffolk collection.',
         1800000, 2500000, 1800000, 'Physical', 'Listed', 5),
        ('LOT-2025-012', 4, 'Caravaggio (Attributed)', 'Saint Jerome Writing', 'Paintings', '116 x 91 cm', 'Period frame', 1605,
         'Significant work showing the saint in contemplation, dramatic chiaroscuro technique.',
         3500000, 5000000, 3500000, 'Physical', 'Listed', 5),
        
        ('LOT-2024-050', 5, 'John Singer Sargent', 'Lady in White', 'Paintings', '127 x 101 cm', 'Gilt frame', 1891,
         'Portrait of society figure, exceptional condition.',
         150000, 200000, 150000, 'Physical', 'Sold', 2, 185000),
        ('LOT-2024-051', 5, 'Lawrence Alma-Tadema', 'Roman Bath Scene', 'Paintings', '92 x 134 cm', 'Ornate frame', 1886,
         'Classical scene with marble architecture.',
         95000, 135000, 95000, 'Physical', 'Sold', 2, 142000),
        ('LOT-2024-052', 5, 'Frederic Leighton', 'Flaming June Studies', 'Works on Paper', '45 x 61 cm', 'Museum mount', 1895,
         'Preparatory sketches for the famous painting.',
         25000, 35000, 25000, 'Physical', 'Sold', 3, 32000),
        
        ('LOT-2024-060', 6, 'Jackson Pollock', 'Composition No. 7', 'Paintings', '122 x 183 cm', 'Simple frame', 1950,
         'Drip painting technique, authenticated by the Pollock-Krasner Foundation.',
         4500000, 6000000, 4500000, 'Physical', 'Sold', 4, 5200000),
        ('LOT-2024-061', 6, 'Mark Rothko', 'Untitled (Orange and Yellow)', 'Paintings', '206 x 175 cm', 'Unframed', 1956,
         'Large scale color field painting, vibrant hues.',
         3800000, 5200000, 3800000, 'Physical', 'Sold', 4, 4750000),
        ('LOT-2024-062', 6, 'Willem de Kooning', 'Woman Series Study', 'Works on Paper', '61 x 48 cm', 'Museum mount', 1952,
         'Charcoal and pastel on paper, dynamic composition.',
         180000, 250000, 180000, 'Physical', 'Unsold', 4),
        
        ('LOT-2025-020', None, 'Lucian Freud', 'Portrait Study', 'Paintings', '51 x 41 cm', 'Simple frame', 2003,
         'Oil on canvas board, intimate portrait from late period.',
         75000, 105000, 75000, 'Physical', 'Pending', 5),
        ('LOT-2025-021', None, 'Anselm Kiefer', 'Landscape with Ruins', 'Mixed Media', '190 x 280 cm', 'Unframed', 2015,
         'Mixed media on canvas incorporating lead and straw.',
         220000, 320000, 220000, 'Physical', 'Pending', 5),
        ('LOT-2025-022', None, 'Jeff Koons', 'Balloon Dog (Blue) - Small', 'Sculpture', '25 x 30 x 11 cm', 'Display base', 2021,
         'Porcelain edition, signed and numbered 78/250.',
         15000, 22000, 15000, 'Online', 'Pending', 3),
    ]
    
    for i, lot in enumerate(lots_data):
        # Handle both formats (with and without sold_price)
        if len(lot) == 16:  # Has sold_price
            cursor.execute('''
            INSERT INTO lots (lot_reference, auction_id, artist, title, category, dimensions, 
                              framing_details, year_of_production, description,
                              estimate_low, estimate_high, reserve_price, triage_status, status, seller_id, sold_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', lot)
        else:  # No sold_price
            cursor.execute('''
            INSERT INTO lots (lot_reference, auction_id, artist, title, category, dimensions, 
                              framing_details, year_of_production, description,
                              estimate_low, estimate_high, reserve_price, triage_status, status, seller_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', lot)
    
    conn.commit()
    print("✓ Mock data with multiple auctions and lots seeded successfully")
    print("  - 6 auctions (4 upcoming, 2 completed)")
    print("  - 22 lots across various categories and price ranges")
    print("  - 4 seller clients")

if __name__ == '__main__':
    init_database()
