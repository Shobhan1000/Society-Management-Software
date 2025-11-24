import uuid
from datetime import date
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Annotated
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import models, schemas, crud
from database import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI(title="Inventory Tracker API")
models.Base.metadata.create_all(bind=engine)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# MODELS (for forecast endpoint)
# -------------------------

class ForecastRequest(BaseModel):
    product: str
    currentStock: int
    salesData: str  # comma-separated numbers

class ForecastResponse(BaseModel):
    product: str
    forecast: List[float]

# -------------------------
# POSTGRESQL 
# -------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

# -------------------------
# ITEMS ENDPOINTS
# -------------------------

@app.get("/items/", response_model=List[schemas.Item])
async def list_items(db: db_dependency):
    return db.query(models.Item).all()

@app.post("/items/", response_model=schemas.Item)
def add_item(item: schemas.ItemCreate, db: db_dependency):
    return crud.create_item(db, item)

@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: uuid.UUID, item: schemas.ItemUpdate, db: db_dependency):
    db_item = crud.update_item(db, item_id, item)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@app.delete("/items/{item_id}", response_model=schemas.Item)
def delete_item(item_id: uuid.UUID, db: db_dependency):
    db_item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return db_item

# -------------------------
# SUPPLIERS ENDPOINTS
# -------------------------

@app.get("/suppliers/", response_model=List[schemas.Supplier])
async def list_suppliers(db: db_dependency):
    return db.query(models.Supplier).all()

@app.post("/suppliers/", response_model=schemas.Supplier)
async def add_supplier(supplier: schemas.SupplierCreate, db: db_dependency):
    return crud.create_supplier(db, supplier)

@app.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(supplier_id: uuid.UUID, supplier: schemas.SupplierUpdate, db: db_dependency):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for key, value in supplier.dict(exclude_unset=True).items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.delete("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def delete_supplier(supplier_id: uuid.UUID, db: db_dependency):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(db_supplier)
    db.commit()
    return db_supplier

# -------------------------
# TRANSACTIONS ENDPOINTS
# -------------------------

@app.get("/transactions/", response_model=List[schemas.Transaction])
async def list_transactions(db: db_dependency):
    return db.query(models.Transaction).all()

@app.post("/transactions/", response_model=schemas.Transaction)
async def add_transaction(transaction: schemas.TransactionCreate, db: db_dependency):
    return crud.create_transaction(db, transaction)

@app.delete("/transactions/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(transaction_id: uuid.UUID, db: db_dependency):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_transaction)
    db.commit()
    return db_transaction

# -------------------------
# ALERTS ENDPOINTS
# -------------------------

@app.get("/alerts/", response_model=List[schemas.Alert])
async def list_alerts(db: db_dependency):
    return db.query(models.Alert).all()

@app.post("/alerts/", response_model=schemas.Alert)
async def add_alerts(alert: schemas.AlertCreate, db: db_dependency):
    return crud.create_alert(db, alert.type, alert.title, alert.message, alert.item_id)

@app.delete("/alerts/{alert_id}", response_model=schemas.Alert)
def delete_alert(alert_id: uuid.UUID, db: db_dependency):
    db_alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(db_alert)
    db.commit()
    return db_alert

# -------------------------
# EVENTS ENDPOINTS
# -------------------------

@app.get("/events/", response_model=List[schemas.Event])
async def list_events(db: db_dependency):
    return db.query(models.Event).all()

@app.post("/events/", response_model=schemas.Event)
async def add_events(event: schemas.EventCreate, db: db_dependency):
    return crud.create_event(db, event)

@app.delete("/events/{event_id}", response_model=schemas.Event)
def delete_event(event_id: uuid.UUID, db: db_dependency):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return db_event

# -------------------------
# FORECAST PREDICTION
# -------------------------

@app.post("/api/forecast", response_model=ForecastResponse)
def forecast_demand(request: ForecastRequest):
    sales_list = [float(x.strip()) for x in request.salesData.split(",") if x.strip()]
    if len(sales_list) < 2:
        return {"product": request.product, "forecast": [0]}
    
    try:
        model = ARIMA(sales_list, order=(1, 1, 1))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=6)
        forecast_list = forecast.tolist()
    except Exception as e:
        print("ARIMA error:", e)
        forecast_list = [0] * 6

    return {"product": request.product, "forecast": forecast_list}