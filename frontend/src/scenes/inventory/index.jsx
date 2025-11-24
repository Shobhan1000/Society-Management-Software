import { useState, useEffect, useMemo } from "react";
import { Box, Typography, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Inventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [filterType, setFilterType] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newItem, setNewItem] = useState({
    itemName: "",
    category: "",
    quantity: 0,
    unit: "",
    supplier_id: "",
    lastRestocked: "",
    expiryDate: "",
    lowStockThreshold: 5,
  });

  const handleOpen = () => {
    setIsModalOpen(true);
    setEditItem(null);
    setNewItem({
      itemName: "",
      category: "",
      quantity: 0,
      unit: "",
      supplier_id: "",
      lastRestocked: "",
      expiryDate: "",
      lowStockThreshold: 5,
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Prepare payload with correct types
      const payload = {
        ...newItem,
        quantity: Number(newItem.quantity),
        lowStockThreshold: Number(newItem.lowStockThreshold),
        lastRestocked: newItem.lastRestocked || null,
        expiryDate: newItem.expiryDate || null,
        supplier_id: newItem.supplier_id || null,
      };

      const url = editItem 
        ? `http://localhost:8000/items/${editItem.id}`
        : "http://localhost:8000/items/";
      
      const method = editItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save item:", errorData);
        return;
      }

      const savedItem = await response.json();
      
      if (editItem) {
        setItems(prev => prev.map(item => item.id === editItem.id ? savedItem : item));
      } else {
        setItems(prev => [...prev, savedItem]);
      }
      
      handleClose();
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  // Fetch inventory items and suppliers from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsRes, suppliersRes] = await Promise.all([
          fetch("http://localhost:8000/items/"),
          fetch("http://localhost:8000/suppliers/")
        ]);

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        if (!suppliersRes.ok) throw new Error("Failed to fetch suppliers");

        const itemsData = await itemsRes.json();
        const suppliersData = await suppliersRes.json();

        setItems(itemsData);
        setSuppliers(suppliersData);
      } catch (err) {
        console.error("Fetch error:", err);
        setItems([]);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get supplier name from ID
  const getSupplierName = (supplierId) => {
    if (!supplierId) return "No Supplier";
    
    // Temporary: log the comparison to debug
    const supplier = suppliers.find(s => {
      const match = String(s.id) === String(supplierId);
      return match;
    });
    
    return supplier ? supplier.supplierName : "Supplier Not Found";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not Set";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Handle edit action
  const handleEdit = () => {
    if (selectionModel.length === 1) {
      const itemToEdit = items.find(item => item.id === selectionModel[0]);
      if (itemToEdit) {
        setEditItem(itemToEdit);
        setNewItem({
          itemName: itemToEdit.itemName || "",
          category: itemToEdit.category || "",
          quantity: itemToEdit.quantity || 0,
          unit: itemToEdit.unit || "",
          supplier_id: itemToEdit.supplier_id || "",
          lastRestocked: itemToEdit.lastRestocked || "",
          expiryDate: itemToEdit.expiryDate || "",
          lowStockThreshold: itemToEdit.lowStockThreshold || 5,
        });
        setIsModalOpen(true);
      }
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (selectionModel.length > 0) {
      setItemsToDelete(selectionModel);
      setDeleteConfirmOpen(true);
    }
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      // Delete each selected item
      for (const id of itemsToDelete) {
        const response = await fetch(`http://localhost:8000/items/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          console.error(`Failed to delete item ${id}`);
        }
      }
      
      // Update local state
      setItems(prev => prev.filter(item => !itemsToDelete.includes(item.id)));
      setSelectionModel([]);
    } catch (err) {
      console.error("Error deleting items:", err);
    } finally {
      setDeleteConfirmOpen(false);
      setItemsToDelete([]);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemsToDelete([]);
  };

// -------------------- FILTERED ITEMS --------------------
const filteredItems = useMemo(() => {
  if (filterType === "All") return items;

  return items.filter(item => {
    const quantity = item.quantity || 0;
    const threshold = item.lowStockThreshold || 5;
    const status = quantity <= threshold ? "low" : "ok";
    return status === filterType.toLowerCase();
  });
}, [items, filterType]);
  const columns = [
    { 
      field: "id", 
      headerName: "ID", 
      width: 100, 
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: colors.grey[400] }}>
          {params.value.substring(0, 6)}...
        </Typography>
      )
    },
    { field: "itemName", headerName: "Item Name", flex: 1, cellClassName: "name-column--cell" },
    { field: "category", headerName: "Category", width: 120 },
    { field: "quantity", headerName: "Qty", width: 80, type: "number" },
    { field: "unit", headerName: "Unit", width: 60 },
    { 
      field: "supplier_id", 
      headerName: "Supplier", 
      flex: 1,
      renderCell: (params) => {
        return getSupplierName(params.value);
      },
    },
    { 
      field: "lastRestocked", 
      headerName: "Last Restocked", 
      width: 120, 
      valueGetter: (params) => formatDate(params.value)
    },
    { 
      field: "expiryDate", 
      headerName: "Expiry Date", 
      width: 120, 
      valueGetter: (params) => formatDate(params.value)
    },
    { field: "lowStockThreshold", headerName: "Low Stock Level", width: 110, type: "number" },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography color={colors.grey[500]}>N/A</Typography>;
        const quantity = params.row.quantity || 0;
        const threshold = params.row.lowStockThreshold || 5;
        return (
          <Typography 
            color={quantity <= threshold ? colors.redAccent[500] : colors.greenAccent[500]}
            fontWeight="bold"
            fontSize="0.8rem"
          >
            {quantity <= threshold ? "LOW" : "OK"}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Inventory" subtitle="Managing the Inventory Items" />

      {/* Action Buttons */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add New Item
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={selectionModel.length !== 1}
        >
          Edit Selected
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={selectionModel.length === 0}
        >
          Delete Selected
        </Button>

        {/* Filter Dropdown */}
        <TextField
          select
          label="Filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="ok">OK</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </Box>

      {selectionModel.length > 0 && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography>
            {selectionModel.length} row{selectionModel.length > 1 ? "s" : ""} selected
          </Typography>
        </Box>
      )}

      {/* DataGrid */}
      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none", backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          rows={filteredItems}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
          selectionModel={selectionModel}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add/Edit Item Modal */}
      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            name="itemName"
            value={newItem.itemName}
            onChange={handleInputChange}
            required
          />
          <TextField
            label="Category"
            variant="outlined"
            fullWidth
            name="category"
            value={newItem.category}
            onChange={handleInputChange}
            required
          />
          <TextField
            label="Quantity"
            type="number"
            variant="outlined"
            fullWidth
            name="quantity"
            value={newItem.quantity}
            onChange={handleInputChange}
            required
          />
          <TextField
            label="Unit"
            variant="outlined"
            fullWidth
            name="unit"
            value={newItem.unit}
            onChange={handleInputChange}
            required
          />
          <TextField
            select
            label="Supplier"
            variant="outlined"
            fullWidth
            name="supplier_id"
            value={newItem.supplier_id}
            onChange={handleInputChange}
          >
            <MenuItem value="">No Supplier</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.supplierName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Last Restocked"
            type="date"
            variant="outlined"
            fullWidth
            name="lastRestocked"
            InputLabelProps={{ shrink: true }}
            value={newItem.lastRestocked}
            onChange={handleInputChange}
          />
          <TextField
            label="Expiry Date"
            type="date"
            variant="outlined"
            fullWidth
            name="expiryDate"
            InputLabelProps={{ shrink: true }}
            value={newItem.expiryDate}
            onChange={handleInputChange}
          />
          <TextField
            label="Low Stock Threshold"
            type="number"
            variant="outlined"
            fullWidth
            name="lowStockThreshold"
            value={newItem.lowStockThreshold}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="warning" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editItem ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {itemsToDelete.length} item{itemsToDelete.length > 1 ? 's' : ''}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;