import uuid
from sqlalchemy.orm import Session
from models import Item, Supplier, Alert, Transaction, Event
from schemas import ItemCreate, ItemUpdate, TransactionBase, SupplierCreate, EventCreate
from datetime import date


# -------------------------
# Helper functions
# -------------------------
def check_low_stock_alert(db: Session, item: Item):
    """Trigger low stock alert if needed."""
    if item.quantity <= item.lowStockThreshold:
        existing_alert = db.query(Alert).filter(
            Alert.item_id == item.id,
            Alert.type == "Low Stock"
        ).first()
        if not existing_alert:
            alert = Alert(
                type="Low Stock",
                title=f"Low stock for {item.itemName}",
                message=f"Only {item.quantity} left in stock.",
                item_id=item.id
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)


def check_expiry_alert(db: Session, item: Item):
    """Trigger expiry alert if item is expired or close to expiry."""
    if item.expiryDate:
        days_until_expiry = (item.expiryDate - date.today()).days
        
        # Clear existing expiry alert if item is no longer expired/close to expiry
        existing_alert = db.query(Alert).filter(
            Alert.item_id == item.id,
            Alert.type == "Expiry"
        ).first()
        
        if days_until_expiry <= 0:  # Expired
            if not existing_alert:
                alert = Alert(
                    type="Expiry",
                    title=f"{item.itemName} expired!",
                    message=f"{item.itemName} expired on {item.expiryDate}.",
                    item_id=item.id
                )
                db.add(alert)
        elif days_until_expiry <= 7:  # Expiring soon (within 7 days)
            if not existing_alert:
                alert = Alert(
                    type="Expiry",
                    title=f"{item.itemName} expiring soon!",
                    message=f"{item.itemName} will expire in {days_until_expiry} days.",
                    item_id=item.id
                )
                db.add(alert)
        elif existing_alert:  # No longer expiring soon/expired
            db.delete(existing_alert)
            
        db.commit()


# -------------------------
# Items
# -------------------------
def create_item(db: Session, item: ItemCreate):
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    check_low_stock_alert(db, db_item)
    check_expiry_alert(db, db_item)

    return db_item


def update_item(db: Session, item_id: uuid.UUID, updates: ItemUpdate):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        return None

    for key, value in updates.dict(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    check_low_stock_alert(db, db_item)
    check_expiry_alert(db, db_item)

    return db_item


# -------------------------
# Transactions
# -------------------------
def create_transaction(db: Session, txn: TransactionBase):
    db_txn = Transaction(**txn.dict())
    db.add(db_txn)

    item = db.query(Item).filter(Item.id == txn.item_id).first()
    if item:
        if db_txn.type.lower() == "purchase":
            item.quantity += db_txn.quantity
        elif db_txn.type.lower() == "sale":
            item.quantity -= db_txn.quantity

        check_low_stock_alert(db, item)
        check_expiry_alert(db, item)

    db.commit()
    db.refresh(db_txn)
    return db_txn


# -------------------------
# Alerts
# -------------------------
def create_alert(db: Session, type: str, title: str, message: str, item_id: uuid.UUID = None):
    alert = Alert(type=type, title=title, message=message, item_id=item_id)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def clear_resolved_alerts(db: Session, item: Item):
    """Clear low stock alerts if stock is no longer low."""
    if item.quantity > item.lowStockThreshold:
        existing_alert = db.query(Alert).filter(
            Alert.item_id == item.id,
            Alert.type == "Low Stock"
        ).first()
        if existing_alert:
            db.delete(existing_alert)
            db.commit()


# -------------------------
# Suppliers
# -------------------------
def create_supplier(db: Session, supplier: SupplierCreate):
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_supplier(db: Session, supplier_id: uuid.UUID):
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


# -------------------------
# Events
# -------------------------
def create_event(db: Session, event: EventCreate):
    db_event = Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event