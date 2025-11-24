import { Box, Typography, MenuItem, Select, FormControl, InputLabel, useTheme, Chip, TextField, Autocomplete } from "@mui/material";
import Header from "../../components/Header";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import PieChart from "../../components/PieChart";
import { useState, useEffect } from "react";
import { tokens } from "../../theme";

const Analytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [dataType, setDataType] = useState("stockLevels");
  const [timeRange, setTimeRange] = useState("30");
  const [selectedItems, setSelectedItems] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsRes, transactionsRes] = await Promise.all([
          fetch("http://localhost:8000/items/"),
          fetch("http://localhost:8000/transactions/"),
        ]);

        if (!itemsRes.ok) throw new Error("Failed to fetch items");
        if (!transactionsRes.ok) throw new Error("Failed to fetch transactions");

        const itemsData = await itemsRes.json();
        const transactionsData = await transactionsRes.json();

        setItems(itemsData);
        setTransactions(transactionsData);
        setError("");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please check if the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for different data types
  const getChartData = () => {
    switch (dataType) {
      case "stockLevels":
        return prepareStockLevelsData();
      case "salesRevenue":
        return prepareSalesRevenueData();
      case "categoryDistribution":
        return prepareCategoryDistributionData();
      case "topSellingItems":
        return prepareTopSellingItemsData();
      case "transactionTrends":
        return prepareTransactionTrendsData();
      case "specificItems":
        return prepareSpecificItemsData();
      default:
        return prepareStockLevelsData();
    }
  };

  // Prepare stock levels data
  const prepareStockLevelsData = () => {
    const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    
    return {
      labels: sortedItems.map(item => item.itemName),
      datasets: [
        {
          label: 'Stock Quantity',
          data: sortedItems.map(item => item.quantity),
          backgroundColor: sortedItems.map((_, index) => 
            colors.greenAccent[500 + (index * 100) % 400] || '#4CAF50'
          ),
        },
      ],
    };
  };

  // Prepare sales revenue data
  const prepareSalesRevenueData = () => {
    const sales = transactions.filter(t => t.type?.toLowerCase() === "sale");
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const filteredSales = sales.filter(sale => 
      sale.date && new Date(sale.date) >= cutoffDate
    );

    // Group by date
    const salesByDate = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += sale.amount || 0;
      return acc;
    }, {});

    const sortedDates = Object.keys(salesByDate).sort((a, b) => 
      new Date(a) - new Date(b)
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Sales Revenue ($)',
          data: sortedDates.map(date => salesByDate[date]),
          borderColor: colors.blueAccent[500] || '#2196F3',
          backgroundColor: colors.blueAccent[500] + '40' || '#2196F340',
        },
      ],
    };
  };

  // Prepare category distribution data
  const prepareCategoryDistributionData = () => {
    const categoryCount = items.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) acc[category] = 0;
      acc[category] += item.quantity || 0;
      return acc;
    }, {});

    const categories = Object.keys(categoryCount);
    const quantities = Object.values(categoryCount);

    return {
      labels: categories,
      datasets: [
        {
          label: 'Items per Category',
          data: quantities,
          backgroundColor: categories.map((_, index) => 
            `hsl(${(index * 360) / categories.length}, 70%, 60%)`
          ),
        },
      ],
    };
  };

  // Prepare top selling items data
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
          backgroundColor: colors.redAccent[500] || '#F44336',
        },
      ],
    };
  };

  // Prepare transaction trends data
  const prepareTransactionTrendsData = () => {
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const filteredTransactions = transactions.filter(t => 
      t.date && new Date(t.date) >= cutoffDate
    );

    // Group by date and type
    const transactionsByDate = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { sales: 0, purchases: 0 };
      }
      if (transaction.type?.toLowerCase() === "sale") {
        acc[date].sales += transaction.amount || 0;
      } else if (transaction.type?.toLowerCase() === "purchase") {
        acc[date].purchases += transaction.amount || 0;
      }
      return acc;
    }, {});

    const sortedDates = Object.keys(transactionsByDate).sort((a, b) => 
      new Date(a) - new Date(b)
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Sales ($)',
          data: sortedDates.map(date => transactionsByDate[date].sales),
          borderColor: colors.greenAccent[500] || '#4CAF50',
          backgroundColor: colors.greenAccent[500] + '40' || '#4CAF5040',
        },
        {
          label: 'Purchases ($)',
          data: sortedDates.map(date => transactionsByDate[date].purchases),
          borderColor: colors.redAccent[500] || '#F44336',
          backgroundColor: colors.redAccent[500] + '40' || '#F4433640',
        },
      ],
    };
  };

  // Prepare specific items data
  const prepareSpecificItemsData = () => {
    if (selectedItems.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const sales = transactions.filter(t => t.type?.toLowerCase() === "sale");
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Get sales data for selected items
    const itemSalesData = selectedItems.map(selectedItem => {
      const itemSales = sales.filter(sale => {
        // Find matching item by various ID fields
        const matches = items.find(item => 
          (item.id === selectedItem.id || item.id === selectedItem) ||
          (item.uuid === selectedItem.id || item.uuid === selectedItem) ||
          (item._id === selectedItem.id || item._id === selectedItem) ||
          (item.itemId === selectedItem.id || item.itemId === selectedItem)
        );
        
        return matches && sale.item_id && (
          sale.item_id === matches.id ||
          sale.item_id === matches.uuid ||
          sale.item_id === matches._id ||
          sale.item_id === matches.itemId
        );
      });

      // Group by date
      const salesByDate = itemSales.reduce((acc, sale) => {
        if (sale.date && new Date(sale.date) >= cutoffDate) {
          const date = new Date(sale.date).toLocaleDateString();
          if (!acc[date]) acc[date] = 0;
          acc[date] += sale.quantity || 0;
        }
        return acc;
      }, {});

      return {
        label: selectedItem.itemName || selectedItem.name || `Item ${selectedItem.id}`,
        data: Object.values(salesByDate),
        borderColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)40`,
      };
    });

    // Get all unique dates
    const allDates = [...new Set(
      itemSalesData.flatMap(dataset => 
        Object.keys(dataset.data).sort((a, b) => new Date(a) - new Date(b))
      )
    )];

    return {
      labels: allDates,
      datasets: itemSalesData,
    };
  };

  const chartData = getChartData();
  const chartTitle = getChartTitle();

  function getChartTitle() {
    switch (dataType) {
      case "stockLevels": return "Top Items by Stock Levels";
      case "salesRevenue": return `Sales Revenue (Last ${timeRange} Days)`;
      case "categoryDistribution": return "Inventory Distribution by Category";
      case "topSellingItems": return "Top Selling Items";
      case "transactionTrends": return `Transaction Trends (Last ${timeRange} Days)`;
      case "specificItems": return `Specific Items Analysis (Last ${timeRange} Days)`;
      default: return "Analytics Dashboard";
    }
  }

  // Render the appropriate chart component
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      isDashboard: true,
      options: {
        scales: {
          x: {
            ticks: {
              maxRotation: dataType === "transactionTrends" && parseInt(timeRange) > 7 ? 90 : 0,
              minRotation: dataType === "transactionTrends" && parseInt(timeRange) > 7 ? 90 : 0,
            }
          }
        }
      }
    };

    switch (chartType) {
      case "bar":
        return <BarChart {...commonProps} />;
      case "line":
        return <LineChart {...commonProps} />;
      case "pie":
        return <PieChart {...commonProps} />;
      default:
        return <BarChart {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <Box m="20px">
        <Header title="Analytics Dashboard" subtitle="Loading data..." />
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m="20px">
        <Header title="Analytics Dashboard" subtitle="Error loading data" />
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="Analytics Dashboard" subtitle="Data-driven insights from your inventory" />
      
      {/* Chart Controls */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            label="Chart Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            <MenuItem value="bar">Bar Chart</MenuItem>
            <MenuItem value="line">Line Chart</MenuItem>
            <MenuItem value="pie">Pie Chart</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Data Type</InputLabel>
          <Select
            value={dataType}
            label="Data Type"
            onChange={(e) => setDataType(e.target.value)}
          >
            <MenuItem value="stockLevels">Stock Levels</MenuItem>
            <MenuItem value="salesRevenue">Sales Revenue</MenuItem>
            <MenuItem value="categoryDistribution">Category Distribution</MenuItem>
            <MenuItem value="topSellingItems">Top Selling Items</MenuItem>
            <MenuItem value="transactionTrends">Transaction Trends</MenuItem>
            <MenuItem value="specificItems">Specific Items Analysis</MenuItem>
          </Select>
        </FormControl>

        {(dataType === "salesRevenue" || dataType === "transactionTrends" || dataType === "specificItems") && (
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
        )}

        {dataType === "specificItems" && (
          <Autocomplete
            multiple
            limitTags={2}
            options={items}
            getOptionLabel={(option) => option.itemName || option.name || `Item ${option.id}`}
            value={selectedItems}
            onChange={(event, newValue) => {
              setSelectedItems(newValue.slice(0, 10)); // Limit to 10 items
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Items (max 10)"
                placeholder="Choose items to analyze"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.itemName || option.name || `Item ${option.id}`}
                  {...getTagProps({ index })}
                  size="small"
                />
              ))
            }
            sx={{ minWidth: 300 }}
          />
        )}
      </Box>

      {/* Chart Title */}
      <Typography variant="h4" fontWeight="bold" color={colors.grey[100]} mb={2}>
        {chartTitle}
      </Typography>

      {/* Statistics Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Box p={2} borderRadius={2} bgcolor={colors.primary[400]} minWidth={200}>
          <Typography variant="h6" color={colors.grey[300]}>Total Items</Typography>
          <Typography variant="h4" fontWeight="bold" color={colors.greenAccent[500]}>
            {items.length}
          </Typography>
        </Box>
        <Box p={2} borderRadius={2} bgcolor={colors.primary[400]} minWidth={200}>
          <Typography variant="h6" color={colors.grey[300]}>Total Stock</Typography>
          <Typography variant="h4" fontWeight="bold" color={colors.blueAccent[500]}>
            {items.reduce((acc, item) => acc + (item.quantity || 0), 0)}
          </Typography>
        </Box>
        <Box p={2} borderRadius={2} bgcolor={colors.primary[400]} minWidth={200}>
          <Typography variant="h6" color={colors.grey[300]}>Total Sales</Typography>
          <Typography variant="h4" fontWeight="bold" color={colors.redAccent[500]}>
            {transactions.filter(t => t.type?.toLowerCase() === "sale").length}
          </Typography>
        </Box>
      </Box>

      {/* Chart */}
      <Box height="60vh" bgcolor={colors.primary[400]} p={3} borderRadius={2}>
        {renderChart()}
      </Box>

      {/* Data Summary */}
      <Box mt={3} p={2} bgcolor={colors.primary[400]} borderRadius={2}>
        <Typography variant="h6" color={colors.grey[100]} mb={1}>
          Data Summary
        </Typography>
        <Typography variant="body2" color={colors.grey[300]}>
          Showing {chartData.labels?.length || 0} data points • 
          Last updated: {new Date().toLocaleString()} • 
          Total records: {items.length} items, {transactions.length} transactions
          {dataType === "specificItems" && ` • Selected items: ${selectedItems.length}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default Analytics;