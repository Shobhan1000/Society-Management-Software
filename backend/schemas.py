import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# -------------------------
# ITEM SCHEMAS
# -------------------------
class ItemBase(BaseModel):
    itemName: str
    category: str
    quantity: int
    unit: str
    supplier_id: uuid.UUID
    lastRestocked: Optional[date] = None
    expiryDate: Optional[date] = None
    lowStockThreshold: int


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    itemName: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    supplier_id: Optional[uuid.UUID] = None
    lastRestocked: Optional[date] = None
    expiryDate: Optional[date] = None
    lowStockThreshold: Optional[int] = None


class Item(ItemBase):
    id: uuid.UUID
    supplier_id: uuid.UUID

    class Config:
        orm_mode = True


# -------------------------
# SUPPLIER SCHEMAS
# -------------------------
class SupplierBase(BaseModel):
    supplierName: str
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    itemsProvided: Optional[str] = None
    status: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplierName: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    address: Optional[str] = None
    itemsProvided: Optional[str] = None
    status: Optional[str] = None


class Supplier(SupplierBase):
    id: uuid.UUID

    class Config:
        orm_mode = True


# -------------------------
# TRANSACTION SCHEMAS
# -------------------------
class TransactionBase(BaseModel):
    date: date
    description: str
    amount: float
    quantity: int
    type: str
    category: Optional[str] = None
    status: Optional[str] = None
    item_id: uuid.UUID


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    quantity: Optional[int] = None
    type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class Transaction(TransactionBase):
    id: uuid.UUID

    class Config:
        orm_mode = True


# -------------------------
# ALERT SCHEMAS
# -------------------------
class AlertBase(BaseModel):
    type: str
    title: str
    message: str
    item_id: Optional[uuid.UUID] = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    item_id: Optional[uuid.UUID] = None


class Alert(AlertBase):
    id: uuid.UUID

    class Config:
        orm_mode = True


# -------------------------
# EVENT SCHEMAS
# -------------------------
class EventBase(BaseModel):
    title: str
    description: str
    date: date


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None


class Event(EventBase):
    id: uuid.UUID

    class Config:
        orm_mode = True