import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Float, DateTime
from database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator, CHAR

# UUID type for databases that don't have native UUID support
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                # hexstring
                return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class Item(Base):
    __tablename__ = 'items'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    itemName = Column(String, index=True)
    category = Column(String)
    quantity = Column(Integer)
    unit = Column(String)
    lastRestocked = Column(Date)
    expiryDate = Column(Date)
    lowStockThreshold = Column(Integer)

    supplier_id = Column(GUID(), ForeignKey("suppliers.id"))
    supplier = relationship("Supplier", back_populates="items")

class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    supplierName = Column(String, index=True)
    contactPerson = Column(String)
    email = Column(String)
    phoneNumber = Column(String)
    address = Column(String)
    itemsProvided = Column(String)
    status = Column(String)

    items = relationship("Item", back_populates="supplier")

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    date = Column(Date)
    description = Column(String)
    amount = Column(Float)
    quantity = Column(Integer)
    type = Column(String)
    category = Column(String)
    status = Column(String)

    item_id = Column(GUID(), ForeignKey("items.id"))
    item = relationship("Item", backref="transactions")

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(String)
    title = Column(String)
    message = Column(String)
    item_id = Column(GUID(), ForeignKey("items.id"))

    item = relationship("Item", backref="alerts")

class Event(Base):
    __tablename__ = 'events'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String)
    description = Column(String)
    date = Column(Date)