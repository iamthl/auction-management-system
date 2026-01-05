import sqlite3
from datetime import datetime, timedelta, date
import os
from passlib.context import CryptContext

# Fix for deprecation warning
def adapt_date(val):
    return val.isoformat()

sqlite3.register_adapter(date, adapt_date)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def init_database():
    """Initialize SQLite database with schema for Fotherby's Auction House"""
    
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect('data/fotherbys.db')
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()
    
    # Create Tables (if they don't exist)
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS auctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        location TEXT NOT NULL CHECK(location IN ('London', 'Paris', 'New York')),
        auction_date DATE NOT NULL,
        start_time TEXT NOT NULL CHECK(start_time IN ('9:30am', '2:00pm', '7:00pm')),
        theme TEXT,
        auction_type TEXT DEFAULT 'Physical' CHECK(auction_type IN ('Physical', 'Online')),
        status TEXT DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Completed', 'Cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT 0
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_reference TEXT UNIQUE NOT NULL,
        auction_id INTEGER,
        artist TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'Fine Art',
        subcategory TEXT,
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
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Listed', 'Sold', 'Unsold', 'Withdrawn', 'Archived')),
        is_archived BOOLEAN DEFAULT 0,
        withdrawn_date DATE,
        withdrawal_fee REAL DEFAULT 0,
        seller_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        medium TEXT,
        material TEXT,
        weight REAL,
        height REAL,
        width REAL,
        depth REAL,
        is_framed BOOLEAN DEFAULT 0,
        FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES clients(id) ON DELETE SET NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS lot_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        is_primary BOOLEAN DEFAULT 0,
        media_type TEXT DEFAULT 'image',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
    )
    ''')
    
    # Clients
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        first_name TEXT,
        last_name TEXT,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        bank_account_number TEXT,
        bank_sort_code TEXT,
        client_type TEXT NOT NULL CHECK(client_type IN ('Buyer', 'Seller', 'Joint')),
        is_approved BOOLEAN DEFAULT 0,
        is_staff BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
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
    
    # RUN MIGRATIONS (Add missing columns to existing tables)
    print("Checking for schema updates...")
    
    migrations = [
        # Table, Column, Type
        ("lots", "medium", "TEXT"),
        ("lots", "material", "TEXT"),
        ("lots", "weight", "REAL"),
        ("lots", "height", "REAL"),
        ("lots", "width", "REAL"),
        ("lots", "depth", "REAL"),
        ("lots", "subcategory", "TEXT"), 
        ("lots", "is_framed", "INTEGER DEFAULT 0"),
        ("lots", "is_archived", "INTEGER DEFAULT 0"),
        ("auctions", "is_archived", "INTEGER DEFAULT 0"),
        ("lot_images", "media_type", "TEXT DEFAULT 'image'"),
        ("clients", "title", "TEXT"),
        ("clients", "first_name", "TEXT"),
        ("clients", "last_name", "TEXT"),
        ("clients", "bank_account_number", "TEXT"),
        ("clients", "bank_sort_code", "TEXT"),
        ("clients", "is_approved", "BOOLEAN DEFAULT 0")
    ]
    
    for table, col, col_type in migrations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            print(f"-> Added column '{col}' to table '{table}'")
        except sqlite3.OperationalError as e:
            # Column likely exists
            if "duplicate column" not in str(e).lower():
                pass
                
    conn.commit()
    print("✓ Database schema updated successfully")
    
    # Seed Data
    seed_data(cursor, conn)
    
    conn.close()

def seed_data(cursor, conn):
    """Seed database with basic initial data"""
    admin_hash = get_password_hash("admin123")
    
    cursor.execute('''
    INSERT OR IGNORE INTO clients (name, email, password_hash, client_type, is_staff, is_approved)
    VALUES (?, ?, ?, ?, ?, 1)
    ''', ('Admin Staff', 'admin@fotherbys.com', admin_hash, 'Joint', 1))
    
    conn.commit()
    print("✓ Basic seed data checked")

if __name__ == '__main__':
    init_database()