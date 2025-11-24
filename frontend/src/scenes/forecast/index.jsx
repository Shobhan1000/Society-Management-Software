import { Box, Button, TextField, Typography, MenuItem, FormControl, InputLabel, Select, Card, CardContent, CircularProgress, Alert } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Forecast = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [forecastResult, setForecastResult] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState("");

  // Fetch items and transactions data
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

  // Prepare historical sales data for selected item
  const prepareHistoricalData = (itemId) => {
    if (!itemId) return [];

    const sales = transactions.filter(t => 
      t.type?.toLowerCase() === "sale" && 
      (t.item_id === itemId || t.item_id === itemId.toString())
    );

    // Group sales by month
    const salesByMonth = sales.reduce((acc, sale) => {
      if (sale.date) {
        const date = new Date(sale.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: monthYear,
            sales: 0,
            revenue: 0
          };
        }
        
        acc[monthYear].sales += sale.quantity || 0;
        acc[monthYear].revenue += sale.amount || 0;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(salesByMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  };

  const handleItemChange = (itemId, setFieldValue) => {
    const item = items.find(i => i.id === itemId || i._id === itemId || i.uuid === itemId);
    setSelectedItem(item);
    
    // Update Formik's state with the current stock
    if (item) {
      setFieldValue("currentStock", item.quantity || "");
      
      const historical = prepareHistoricalData(itemId);
      setHistoricalData(historical);
    } else {
      setFieldValue("currentStock", "");
      setHistoricalData([]);
    }
  };

  const handleFormSubmit = async (values) => {
    if (!selectedItem) {
      setError("Please select an item first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare sales data from historical data or manual input
      let salesData;
      if (values.useHistoricalData) {
        // Convert array to comma-separated string
        salesData = historicalData.map(month => month.sales).join(",");
      } else {
        // Already a string from the input
        salesData = values.salesData;
      }

      // Validate sales data
      const salesArray = salesData.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
      
      if (salesArray.length < 3) {
        setError("Need at least 3 valid data points for forecasting");
        setLoading(false);
        return;
      }

      const payload = {
        product: selectedItem.itemName || selectedItem.name,
        currentStock: parseInt(values.currentStock) || 0,
        salesData: salesData, // Send as string, not array
        forecastPeriod: parseInt(values.forecastPeriod),
        confidenceLevel: parseFloat(values.confidenceLevel)
      };

      console.log("Sending payload:", payload);

      const response = await fetch("http://127.0.0.1:8000/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setForecastResult(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setError(`Error fetching forecast: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for visualization
  const prepareChartData = () => {
    if (!forecastResult || !historicalData.length) return [];

    const chartData = [...historicalData];
    
    // Add forecast data
    forecastResult.forecast.forEach((value, index) => {
      const lastDate = new Date(chartData[chartData.length - 1].month);
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + index + 1);
      
      const monthYear = `${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      chartData.push({
        month: monthYear,
        sales: value,
        revenue: value * (historicalData[historicalData.length - 1]?.revenue / historicalData[historicalData.length - 1]?.sales || 1),
        isForecast: true
      });
    });

    return chartData;
  };

  const chartData = prepareChartData();

  return (
    <Box m="20px">
      <Header title="DEMAND FORECAST" subtitle="Predict Future Demand Using AI" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
          setFieldValue
        }) => (
          <form onSubmit={handleSubmit}>
            <Box display="grid" gap="30px" gridTemplateColumns="repeat(12, 1fr)">
              {/* Item Selection */}
              <FormControl sx={{ gridColumn: "span 6" }}>
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={selectedItem?.id || ""}
                  label="Select Item"
                  onChange={(e) => handleItemChange(e.target.value, setFieldValue)}
                >
                  {items.map((item) => (
                    <MenuItem key={item.id || item._id} value={item.id || item._id}>
                      {item.itemName || item.name} (Stock: {item.quantity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Current Stock"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.currentStock || (selectedItem?.quantity || "")}
                name="currentStock"
                error={!!touched.currentStock && !!errors.currentStock}
                helperText={touched.currentStock && errors.currentStock}
                sx={{ gridColumn: "span 6" }}
              />

              {/* Forecast Settings */}
              <FormControl sx={{ gridColumn: "span 4" }}>
                <InputLabel>Forecast Period</InputLabel>
                <Select
                  value={values.forecastPeriod}
                  label="Forecast Period"
                  onChange={handleChange}
                  name="forecastPeriod"
                >
                  <MenuItem value={3}>3 Months</MenuItem>
                  <MenuItem value={6}>6 Months</MenuItem>
                  <MenuItem value={12}>12 Months</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ gridColumn: "span 4" }}>
                <InputLabel>Confidence Level</InputLabel>
                <Select
                  value={values.confidenceLevel}
                  label="Confidence Level"
                  onChange={handleChange}
                  name="confidenceLevel"
                >
                  <MenuItem value={0.8}>80% (Low)</MenuItem>
                  <MenuItem value={0.9}>90% (Medium)</MenuItem>
                  <MenuItem value={0.95}>95% (High)</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ gridColumn: "span 4" }}>
                <InputLabel>Data Source</InputLabel>
                <Select
                  value={values.useHistoricalData ? "historical" : "manual"}
                  label="Data Source"
                  onChange={(e) => setFieldValue("useHistoricalData", e.target.value === "historical")}
                >
                  <MenuItem value="historical">Use Historical Data</MenuItem>
                  <MenuItem value="manual">Manual Input</MenuItem>
                </Select>
              </FormControl>

              {!values.useHistoricalData && (
                <TextField
                  fullWidth
                  variant="filled"
                  type="text"
                  label="Monthly Sales Data (comma-separated)"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.salesData}
                  name="salesData"
                  error={!!touched.salesData && !!errors.salesData}
                  helperText={touched.salesData && errors.salesData}
                  sx={{ gridColumn: "span 12" }}
                />
              )}

              {/* Historical Data Preview */}
              {values.useHistoricalData && historicalData.length > 0 && (
                <Card sx={{ gridColumn: "span 12", p: 2 }}>
                  <Typography variant="h6">Historical Sales Data (Last {historicalData.length} months)</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {historicalData.map(month => month.sales).join(", ")}
                  </Typography>
                </Card>
              )}
            </Box>

            <Box display="flex" justifyContent="end" mt="20px" gap={2}>
              <Button 
                type="submit" 
                color="secondary" 
                variant="contained"
                disabled={loading || !selectedItem}
              >
                {loading ? <CircularProgress size={24} /> : "Predict Demand"}
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      {/* Forecast Results */}
      {forecastResult && (
        <Box mt="30px">
          <Typography variant="h5" gutterBottom>
            Forecast Results for {selectedItem?.itemName || selectedItem?.name}
          </Typography>

          {/* Chart Visualization */}
          {chartData.length > 0 && (
            <Card sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6">Sales Forecast</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    name="Sales Units"
                    strokeWidth={2}
                  />
                  {forecastResult.upper_bounds && (
                    <Line 
                      type="monotone" 
                      dataKey="upper_bounds" 
                      stroke="#82ca9d" 
                      name="Upper Bound"
                      strokeDasharray="3 3"
                    />
                  )}
                  {forecastResult.lower_bounds && (
                    <Line 
                      type="monotone" 
                      dataKey="lower_bounds" 
                      stroke="#ff7300" 
                      name="Lower Bound"
                      strokeDasharray="3 3"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Numerical Results */}
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Forecast Details</Typography>
            
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <CardContent>
                <Typography variant="subtitle1">Monthly Forecast:</Typography>
                {forecastResult.forecast.map((value, index) => (
                  <Typography key={index} variant="body2">
                    Month {index + 1}: {Math.round(value)} units
                  </Typography>
                ))}
              </CardContent>

              {forecastResult.upper_bounds && forecastResult.lower_bounds && (
                <CardContent>
                  <Typography variant="subtitle1">Confidence Interval:</Typography>
                  {forecastResult.upper_bounds.map((upper, index) => (
                    <Typography key={index} variant="body2">
                      Month {index + 1}: {Math.round(forecastResult.lower_bounds[index])} - {Math.round(upper)} units
                    </Typography>
                  ))}
                </CardContent>
              )}
            </Box>

            {/* Recommendations */}
            {selectedItem && (
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Recommendations:</Typography>
                <Typography variant="body2">
                  • Average monthly forecast: {Math.round(forecastResult.forecast.reduce((a, b) => a + b, 0) / forecastResult.forecast.length)} units
                </Typography>
                <Typography variant="body2">
                  • Suggested reorder point: {Math.round(forecastResult.forecast[0] * 1.5)} units
                </Typography>
                <Typography variant="body2">
                  • Current stock coverage: {Math.round((selectedItem.quantity / forecastResult.forecast[0]) * 10) / 10} months
                </Typography>
              </CardContent>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
};

const checkoutSchema = yup.object().shape({
  currentStock: yup.number().min(0, "Must be positive").required("Required"),
  forecastPeriod: yup.number().required("Required"),
  confidenceLevel: yup.number().required("Required"),
  useHistoricalData: yup.boolean(),
  salesData: yup.string().test(
    'salesData-required',
    'Sales data is required when not using historical data',
    function(value) {
      const { useHistoricalData } = this.parent;
      if (useHistoricalData) return true;
      
      // Validate that it's a comma-separated list of numbers
      if (!value) return false;
      
      const numbers = value.split(',').map(num => parseInt(num.trim()));
      return numbers.length >= 3 && numbers.every(num => !isNaN(num));
    }
  )
});

const initialValues = {
  currentStock: "",
  salesData: "",
  forecastPeriod: 6,
  confidenceLevel: 0.9,
  useHistoricalData: true,
};

export default Forecast;