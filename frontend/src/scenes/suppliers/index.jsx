import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Suppliers = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [suppliersToDelete, setSuppliersToDelete] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    address: "",
    itemsProvided: "",
    status: "Active",
  });

  const handleOpen = () => {
    setIsModalOpen(true);
    setEditSupplier(null);
    setNewSupplier({
      supplierName: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      address: "",
      itemsProvided: "",
      status: "Active",
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditSupplier(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Prepare payload with correct types
      const payload = {
        ...newSupplier,
        phoneNumber: newSupplier.phoneNumber || null,
      };

      const url = editSupplier 
        ? `http://localhost:8000/suppliers/${editSupplier.id}`
        : "http://localhost:8000/suppliers/";
      
      const method = editSupplier ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save supplier:", errorData);
        return;
      }

      const savedSupplier = await response.json();
      
      if (editSupplier) {
        setSuppliers(prev => prev.map(supplier => supplier.id === editSupplier.id ? savedSupplier : supplier));
      } else {
        setSuppliers(prev => [...prev, savedSupplier]);
      }
      
      handleClose();
    } catch (err) {
      console.error("Error saving supplier:", err);
    }
  };

  // Fetch suppliers from backend
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/suppliers/");
        
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }

        const data = await response.json();
        setSuppliers(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Handle edit action
  const handleEdit = () => {
    if (selectionModel.length === 1) {
      const supplierToEdit = suppliers.find(supplier => supplier.id === selectionModel[0]);
      if (supplierToEdit) {
        setEditSupplier(supplierToEdit);
        setNewSupplier({
          supplierName: supplierToEdit.supplierName || "",
          contactPerson: supplierToEdit.contactPerson || "",
          email: supplierToEdit.email || "",
          phoneNumber: supplierToEdit.phoneNumber || "",
          address: supplierToEdit.address || "",
          itemsProvided: supplierToEdit.itemsProvided || "",
          status: supplierToEdit.status || "Active",
        });
        setIsModalOpen(true);
      }
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (selectionModel.length > 0) {
      setSuppliersToDelete(selectionModel);
      setDeleteConfirmOpen(true);
    }
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      // Delete each selected supplier
      for (const id of suppliersToDelete) {
        const response = await fetch(`http://localhost:8000/suppliers/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          console.error(`Failed to delete supplier ${id}`);
        }
      }
      
      // Update local state
      setSuppliers(prev => prev.filter(supplier => !suppliersToDelete.includes(supplier.id)));
      setSelectionModel([]);
    } catch (err) {
      console.error("Error deleting suppliers:", err);
    } finally {
      setDeleteConfirmOpen(false);
      setSuppliersToDelete([]);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSuppliersToDelete([]);
  };

  // Define columns for DataGrid
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
    {
      field: "supplierName",
      headerName: "Supplier Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    { field: "contactPerson", headerName: "Contact Person", width: 150 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "itemsProvided", headerName: "Items Provided", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const status = params.value || "Active";
        const color =
          status === "active"
            ? colors.greenAccent[500]
            : status === "Pending"
            ? colors.blueAccent[500]
            : colors.redAccent[500];

        return (
          <Typography color={color} fontWeight="bold">
            {status}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Suppliers" subtitle="Managing the Suppliers" />

      {/* Action Buttons */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
        >
          Add New Supplier
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
      </Box>

      {selectionModel.length > 0 && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography>
            {selectionModel.length} row{selectionModel.length > 1 ? "s" : ""} selected
          </Typography>
        </Box>
      )}

      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={suppliers}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          onSelectionModelChange={(newSelection) =>
            setSelectionModel(newSelection)
          }
          selectionModel={selectionModel}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add/Edit Supplier Modal */}
      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Supplier Name"
            name="supplierName"
            value={newSupplier.supplierName}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Contact Person"
            name="contactPerson"
            value={newSupplier.contactPerson}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={newSupplier.email}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Phone Number"
            name="phoneNumber"
            value={newSupplier.phoneNumber}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Address"
            name="address"
            value={newSupplier.address}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Items Provided"
            name="itemsProvided"
            value={newSupplier.itemsProvided}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            select
            label="Status"
            name="status"
            value={newSupplier.status}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="warning" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editSupplier ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {suppliersToDelete.length} supplier{suppliersToDelete.length > 1 ? 's' : ''}?
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

export default Suppliers;