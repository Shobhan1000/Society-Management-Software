import { useEffect, useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safe color access function
  const getColor = (colorPath, defaultValue = "#ccc") => {
    try {
      const path = colorPath.split('.');
      let value = colors;
      for (const key of path) {
        if (value[key] === undefined) return defaultValue;
        value = value[key];
      }
      return value;
    } catch (error) {
      return defaultValue;
    }
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsRes, transactionsRes, suppliersRes, alertsRes] = await Promise.all([
          fetch("http://localhost:8000/items/"),
          fetch("http://localhost:8000/transactions/"),
          fetch("http://localhost:8000/suppliers/"),
          fetch("http://localhost:8000/alerts/"),
        ]);

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");
        if (!suppliersRes.ok) throw new Error("Failed to fetch suppliers");
        if (!alertsRes.ok) throw new Error("Failed to fetch alerts");

        setItems(await itemsRes.json());
        setTransactions(await transactionsRes.json());
        setSuppliers(await suppliersRes.json());
        setAlerts(await alertsRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const totalItems = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const lowStockItems = items.filter(item => item.quantity <= (item.lowStockThreshold || 0)).length;
  const lowStockItemsPercentage = items.length > 0 ? ((lowStockItems / items.length) * 100).toFixed(2) : 0;
  const totalSuppliers = suppliers.length;

  // Calculate revenue
  const calculateRevenue = () => {
    const today = new Date().toDateString();
    
    const todaySales = transactions
      .filter(t => t && new Date(t.date).toDateString() === today && t.type?.toLowerCase() === "sale")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const todayPurchases = transactions
      .filter(t => t && new Date(t.date).toDateString() === today && t.type?.toLowerCase() === "purchase")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    return todaySales - todayPurchases;
  };

  const todayRevenue = calculateRevenue();

  const getDateStr = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toDateString();
  };

  const calculateRevenueForDate = (dateStr) => {
    const sales = transactions
      .filter(t => t && new Date(t.date).toDateString() === dateStr && t.type?.toLowerCase() === "sale")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const purchases = transactions
      .filter(t => t && new Date(t.date).toDateString() === dateStr && t.type?.toLowerCase() === "purchase")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    return sales - purchases;
  };

  const yesterdayRevenue = calculateRevenueForDate(getDateStr(-1));

  let percentageDifference = 0;
  let trend = "no-change";

  if (yesterdayRevenue !== 0) {
    percentageDifference = Math.round(((todayRevenue - yesterdayRevenue) / Math.abs(yesterdayRevenue)) * 100);
    trend = percentageDifference > 0 ? "up" : percentageDifference < 0 ? "down" : "no-change";
  } else if (todayRevenue !== 0) {
    percentageDifference = 100;
    trend = "up";
  }

  // Prepare data for charts
  const prepareStockLevelsData = () => {
    const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    
    return {
      labels: sortedItems.map(item => item.itemName),
      datasets: [
        {
          label: 'Stock Quantity',
          data: sortedItems.map(item => item.quantity),
          backgroundColor: sortedItems.map((_, index) => 
            getColor(`greenAccent.${500 + (index * 100) % 400}`, '#4CAF50')
          ),
        },
      ],
    };
  };

  const prepareTopSellingItemsData = () => {
    const sales = transactions.filter(t => t.type?.toLowerCase() === "sale");
    
    // Group sales by item_id and sum quantities
    const salesByItem = sales.reduce((acc, sale) => {
      if (sale.item_id) {
        if (!acc[sale.item_id]) acc[sale.item_id] = 0;
        acc[sale.item_id] += sale.quantity || 0;
      }
      return acc;
    }, {});

    // Get top 10 items by sales quantity
    const topItems = Object.entries(salesByItem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([itemId, quantity]) => {
        // Try different possible ID fields
        const item = items.find(i => 
          i.id === itemId || 
          i.uuid === itemId || 
          i._id === itemId ||
          i.itemId === itemId
        );        
        return {
          name: item ? item.itemName : `Item ${itemId.substring(0, 8)}...`,
          quantity: quantity
        };
      });

    return {
      labels: topItems.map(item => item.name),
      datasets: [
        {
          label: 'Units Sold',
          data: topItems.map(item => item.quantity),
          backgroundColor: getColor('redAccent.500', '#F44336'),
        },
      ],
    };
  };

  const stockLevelsData = prepareStockLevelsData();
  const topSellingData = prepareTopSellingItemsData();

  if (loading) {
    return (
      <Box m="20px">
        <Header title="DASHBOARD" subtitle="Welcome to your inventory dashboard" />
        <Typography>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Safe background colors
  const primaryColor = getColor('primary.400', '#1F2A40');
  const primary500Color = getColor('primary.500', '#2d3e52');

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Header title="DASHBOARD" subtitle="Welcome to your inventory dashboard" />
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            sx={{
              backgroundColor: getColor('greenAccent.600', '#4CAF50'),
              color: getColor('grey.100', '#ffffff'),
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              '&:hover': {
                backgroundColor: getColor('greenAccent.700', '#45a049'),
              }
            }}
            onClick={() => navigate("/inventory")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Add New Item
          </Button>
          <Button
            sx={{
              backgroundColor: getColor('blueAccent.600', '#2196F3'),
              color: getColor('grey.100', '#ffffff'),
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              '&:hover': {
                backgroundColor: getColor('blueAccent.700', '#1976D2'),
              }
            }}
            onClick={() => navigate("/transactions")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Record Transaction
          </Button>
          <Button
            sx={{
              backgroundColor: getColor('redAccent.600', '#F44336'),
              color: getColor('grey.100', '#ffffff'),
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              '&:hover': {
                backgroundColor: getColor('redAccent.700', '#D32F2F'),
              }
            }}
            onClick={() => navigate("/suppliers")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Add New Supplier
          </Button>
          <Button
            sx={{
              backgroundColor: getColor('grey.700', '#616161'),
              color: getColor('grey.100', '#ffffff'),
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              '&:hover': {
                backgroundColor: getColor('grey.800', '#424242'),
              }
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gridAutoRows="140px" gap="20px" mt={2}>
        {/* KEY METRICS */}
        <Box gridColumn="span 3" backgroundColor={primaryColor} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/inventory")}>
          <StatBox
            title={totalItems.toLocaleString()}
            subtitle="Total Items in Stock"
            icon={<InventoryIcon sx={{ color: getColor('greenAccent.600', '#4CAF50'), fontSize: "26px" }} />}
            showProgress={false}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={primaryColor} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/alerts")}>
          <StatBox
            title={lowStockItems}
            subtitle="Items Low in Stock"
            progress={lowStockItemsPercentage / 100}
            increase={`${lowStockItemsPercentage}%`}
            icon={<WarningIcon sx={{ color: getColor('redAccent.600', '#F44336'), fontSize: "26px" }} />}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={primaryColor} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/suppliers")}>
          <StatBox
            title={totalSuppliers}
            subtitle="Total Suppliers"
            icon={<LocalShippingIcon sx={{ color: getColor('blueAccent.600', '#2196F3'), fontSize: "26px" }} />}
            showProgress={false}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={primaryColor} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/transactions")}>
          <StatBox
            title={`$${todayRevenue.toLocaleString()}`}
            subtitle="Net Revenue Today"
            progress={percentageDifference / 100}
            increase={`${percentageDifference}%`}
            trend={trend}
            icon={<PointOfSaleIcon sx={{ color: getColor('greenAccent.600', '#4CAF50'), fontSize: "26px" }} />}
          />
        </Box>

        {/* ROW 2 - CHARTS */}
        <Box gridColumn="span 8" gridRow="span 2" backgroundColor={primaryColor} p="20px">
          <Typography variant="h5" fontWeight="600" color={getColor('grey.100', '#ffffff')} mb="10px">
            Stock Level Trends
          </Typography>
          <BarChart isDashboard={true} data={stockLevelsData} />
        </Box>

        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={primaryColor}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${primary500Color}`}
            p="15px"
          >
            <Typography color={getColor('grey.100', '#ffffff')} variant="h5" fontWeight="600">
              Recent Transactions
            </Typography>
            <Typography color={getColor('grey.100', '#ffffff')} variant="body2">
              {transactions.length} total
            </Typography>
          </Box>

          {transactions.slice(-5).reverse().map((transaction) => {
            if (!transaction) return null;
            
            const isSale = transaction.type?.toLowerCase() === "sale";
            const saleColor = getColor('greenAccent.500', '#4CAF50');
            const purchaseColor = getColor('redAccent.500', '#F44336');
            const textColor = getColor('grey.100', '#ffffff');

            return (
              <Box
                key={transaction.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${primary500Color}`}
                p="15px"
              >
                <Box>
                  <Typography 
                    color={isSale ? saleColor : purchaseColor} 
                    variant="h5" 
                    fontWeight="600"
                  >
                    {transaction.description || "No description"}
                  </Typography>
                  <Typography color={textColor} variant="body2">
                    {transaction.quantity || 0} units
                  </Typography>
                </Box>

                <Box color={textColor}>
                  {transaction.date ? new Date(transaction.date).toLocaleDateString() : "No date"}
                </Box>

                <Box
                  backgroundColor={isSale ? saleColor : purchaseColor}
                  p="5px 10px"
                  borderRadius="4px"
                  color={textColor}
                  fontWeight="bold"
                >
                  {isSale ? "+" : "-"}${Math.abs(transaction.amount || 0)}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ROW 3 - MORE CHARTS */}
        <Box gridColumn="span 6" gridRow="span 2" backgroundColor={primaryColor} p="30px" onClick={() => navigate("/analytics")}>
          <Typography variant="h5" fontWeight="600" color={getColor('grey.100', '#ffffff')}>
            Top Selling Items
          </Typography>
          <BarChart isDashboard={true} data={topSellingData} />
        </Box>

        <Box gridColumn="span 6" gridRow="span 2" backgroundColor={primaryColor} p="30px" onClick={() => navigate("/alerts")}>
          <Typography variant="h5" fontWeight="600" color={getColor('grey.100', '#ffffff')}>
            Active Alerts
          </Typography>
          <Box mt={2}>
            {alerts.slice(0, 3).map((alert) => {
              if (!alert) return null;
              
              const isLowStock = alert.type === "Low Stock";
              const alertColor = isLowStock ? getColor('yellowAccent.500', '#FFA726') : getColor('redAccent.500', '#F44336');
              const bgColor = getColor('primary.300', '#374151');

              return (
                <Box
                  key={alert.id}
                  display="flex"
                  alignItems="center"
                  p="10px"
                  borderLeft={`4px solid ${alertColor}`}
                  backgroundColor={bgColor}
                  mb={1}
                >
                  <WarningIcon sx={{ 
                    color: alertColor,
                    mr: 1 
                  }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold" color={getColor('grey.100', '#ffffff')}>
                      {alert.title || "No title"}
                    </Typography>
                    <Typography variant="body2" color={getColor('grey.300', '#D1D5DB')}>
                      {alert.message || "No message"}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            {alerts.length === 0 && (
              <Typography variant="body2" color={getColor('grey.300', '#D1D5DB')} textAlign="center" mt={2}>
                No active alerts
              </Typography>
            )}
            {alerts.length > 3 && (
              <Typography variant="body2" color={getColor('blueAccent.500', '#2196F3')} textAlign="center" mt={1}>
                View all {alerts.length} alerts
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;