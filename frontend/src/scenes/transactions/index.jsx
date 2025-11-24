import { useState, useEffect, useMemo } from "react";
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
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Transactions = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // -------------------- STATE --------------------
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionsToDelete, setTransactionsToDelete] = useState([]);

  const [filterType, setFilterType] = useState("All");
  const [showCalendar, setShowCalendar] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    quantity: 1,
    type: "sale",
    category: "",
    status: "Completed",
    item_id: "",
  });

  // -------------------- FETCH DATA --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsRes, itemsRes] = await Promise.all([
          fetch("http://localhost:8000/transactions/"),
          fetch("http://localhost:8000/items/")
        ]);

        if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
        if (!itemsRes.ok) throw new Error("Failed to fetch items");

        const transactionsData = await transactionsRes.json();
        const itemsData = await itemsRes.json();

        setTransactions(transactionsData);
        setItems(itemsData);
      } catch (err) {
        console.error("Fetch error:", err);
        setTransactions([]);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // -------------------- MODAL HANDLERS --------------------
  const handleOpen = () => {
    setIsModalOpen(true);
    setEditTransaction(null);
    setNewTransaction({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      quantity: 1,
      type: "sale",
      category: "",
      status: "Completed",
      item_id: "",
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditTransaction(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  // Get item name from ID
  const getItemName = (itemId) => {
    if (!itemId) return "No Item";
    const item = items.find(item => item.id === itemId);
    return item ? item.itemName : "Item Not Found";
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...newTransaction,
        amount: Number(newTransaction.amount),
        quantity: Number(newTransaction.quantity),
        date: newTransaction.date,
        item_id: newTransaction.item_id || null,
      };

      const url = editTransaction 
        ? `http://localhost:8000/transactions/${editTransaction.id}`
        : "http://localhost:8000/transactions/";
      
      const method = editTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to save transaction:", errorData);
        return;
      }

      const savedTransaction = await response.json();
      
      if (editTransaction) {
        setTransactions(prev => prev.map(t => t.id === editTransaction.id ? savedTransaction : t));
      } else {
        setTransactions(prev => [...prev, savedTransaction]);
      }
      
      handleClose();
    } catch (err) {
      console.error("Error saving transaction:", err);
    }
  };

  // -------------------- ACTION HANDLERS --------------------
  const handleEdit = () => {
    if (selectionModel.length === 1) {
      const transactionToEdit = transactions.find(t => t.id === selectionModel[0]);
      if (transactionToEdit) {
        setEditTransaction(transactionToEdit);
        setNewTransaction({
          date: transactionToEdit.date || new Date().toISOString().split("T")[0],
          description: transactionToEdit.description || "",
          amount: transactionToEdit.amount || "",
          quantity: transactionToEdit.quantity || 1,
          type: transactionToEdit.type || "sale",
          category: transactionToEdit.category || "",
          status: transactionToEdit.status || "Completed",
          item_id: transactionToEdit.item_id || "",
        });
        setIsModalOpen(true);
      }
    }
  };

  const handleDelete = () => {
    if (selectionModel.length > 0) {
      setTransactionsToDelete(selectionModel);
      setDeleteConfirmOpen(true);
    }
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      // Delete each selected transaction
      for (const id of transactionsToDelete) {
        const response = await fetch(`http://localhost:8000/transactions/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          console.error(`Failed to delete transaction ${id}`);
        }
      }
      
      // Update local state
      setTransactions(prev => prev.filter(t => !transactionsToDelete.includes(t.id)));
      setSelectionModel([]);
    } catch (err) {
      console.error("Error deleting transactions:", err);
    } finally {
      setDeleteConfirmOpen(false);
      setTransactionsToDelete([]);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTransactionsToDelete([]);
  };

  // -------------------- FILTERED TRANSACTIONS --------------------
  const filteredTransactions = useMemo(() => {
    if (filterType === "All") return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  // -------------------- SUMMARY CALCULATIONS --------------------
  const { totalInflow, totalOutflow, netBalance } = useMemo(() => {
    const inflow = transactions
      .filter((t) => t.type === "sale")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const outflow = transactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netBalance: inflow - outflow,
    };
  }, [transactions]);

  // -------------------- COLUMNS FOR DATAGRID --------------------
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
    { field: "date", headerName: "Date", width: 120 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "amount",
      headerName: "Amount",
      width: 130,
      renderCell: (params) => (
        <Typography
          fontWeight="bold"
          color={
            params.row.type === "sale"
              ? colors.greenAccent[500]
              : colors.redAccent[500]
          }
        >
          {params.row.type === "sale" ? `+${params.value}` : `-${params.value}`}
        </Typography>
      ),
    },
    { 
      field: "quantity", 
      headerName: "Qty", 
      width: 80,
      type: "number"
    },
    {
      field: "type", 
      headerName: "Type", 
      width: 120,
      renderCell: (params) => {
        const type = params.value || "";
        if (type.toLowerCase().includes("sale")) {
          return "Sale";
        } else if (type.toLowerCase().includes("purchase")) {
          return "Purchase";
        }
        return type; // fallback
      }
    },
    { field: "category", headerName: "Category", width: 150 },
    { 
      field: "item_id", 
      headerName: "Item", 
      width: 150,
      valueGetter: (params) => getItemName(params.value)
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const color =
          params.value === "completed"
            ? colors.greenAccent[500]
            : params.value === "pending"
            ? colors.blueAccent[500]
            : colors.redAccent[500];
        return <Typography color={color}>{params.value}</Typography>;
      },
    },
  ];

  // -------------------- CALENDAR EVENTS --------------------
  const transactionEvents = transactions.map((t) => ({
    id: t.id,
    title: `${t.type === "sale" ? "sale" : "purchase"}: $${t.amount}`,
    date: t.date,
    backgroundColor:
      t.type === "sale" ? colors.greenAccent[500] : colors.redAccent[500],
    borderColor:
      t.type === "sale" ? colors.greenAccent[700] : colors.redAccent[700],
  }));

  // -------------------- JSX --------------------
  return (
    <Box m="20px">
      <Header title="Transactions" subtitle="Track sales and purchases" />

      {/* SUMMARY BAR */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} mb={3}>
        <Card sx={{ backgroundColor: colors.greenAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Total Sales
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              +${totalInflow.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: colors.redAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Total Purchases
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              -${totalOutflow.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: colors.blueAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Net Balance
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              {netBalance >= 0 ? `+$${netBalance.toFixed(2)}` : `-$${Math.abs(netBalance.toFixed(2))}`}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ACTION BUTTONS */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
        >
          Add New Transaction
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
          <MenuItem value="sale">Sales</MenuItem>
          <MenuItem value="purchase">Purchases</MenuItem>
        </TextField>

        {/* Calendar Toggle */}
        <Button
          variant="contained"
          color="info"
          onClick={() => setShowCalendar((prev) => !prev)}
        >
          {showCalendar ? "Show Table View" : "Show Calendar View"}
        </Button>
      </Box>

      {selectionModel.length > 0 && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography>
            {selectionModel.length} row{selectionModel.length > 1 ? "s" : ""} selected
          </Typography>
        </Box>
      )}

      {/* MAIN VIEW: TABLE OR CALENDAR */}
      {showCalendar ? (
        <Box>
          <FullCalendar
            height="75vh"
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={transactionEvents}
            eventClick={(info) => {
              alert(`${info.event.title} on ${info.event.startStr}`);
            }}
          />
        </Box>
      ) : (
        <Box
          height="75vh"
          sx={{
            "& .MuiDataGrid-root": {
              border: "none",
              backgroundColor: colors.primary[400],
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
            },
          }}
        >
          <DataGrid
            rows={filteredTransactions}
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
      )}

      {/* ADD/EDIT TRANSACTION MODAL */}
      <Dialog open={isModalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTransaction ? "Edit Transaction" : "Add New Transaction"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Date"
            name="date"
            type="date"
            value={newTransaction.date}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Description"
            name="description"
            value={newTransaction.description}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Amount"
            type="number"
            name="amount"
            value={newTransaction.amount}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Quantity"
            type="number"
            name="quantity"
            value={newTransaction.quantity}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            select
            label="Transaction Type"
            name="type"
            value={newTransaction.type}
            onChange={handleInputChange}
            fullWidth
            required
          >
            <MenuItem value="sale">Sale</MenuItem>
            <MenuItem value="purchase">Purchase</MenuItem>
          </TextField>
          <TextField
            label="Category"
            name="category"
            value={newTransaction.category}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            select
            label="Item"
            name="item_id"
            value={newTransaction.item_id}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="">No Item</MenuItem>
            {items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.itemName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            name="status"
            value={newTransaction.status}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="warning" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editTransaction ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {transactionsToDelete.length} transaction{transactionsToDelete.length > 1 ? 's' : ''}?
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

export default Transactions;