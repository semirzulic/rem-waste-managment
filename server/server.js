const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'rem-waste-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data stores (in production, use a database)
const users = [
  {
    id: '1',
    username: 'admin',
    password: bcrypt.hashSync('password123', 10),
    role: 'admin',
    email: 'admin@remwaste.co.uk'
  },
  {
    id: '2',
    username: 'manager',
    password: bcrypt.hashSync('manager123', 10),
    role: 'manager',
    email: 'manager@remwaste.co.uk'
  }
];

let wasteItems = [
  {
    id: '1',
    type: 'General Waste',
    quantity: 500,
    unit: 'kg',
    location: 'Manchester Office',
    clientId: 'CLIENT-001',
    clientName: 'TechCorp Ltd',
    status: 'collected',
    collectionDate: '2024-01-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    type: 'Recycling',
    quantity: 250,
    unit: 'kg',
    location: 'Birmingham Warehouse',
    clientId: 'CLIENT-002',
    clientName: 'GreenBuild Solutions',
    status: 'pending',
    collectionDate: '2024-01-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'REM Waste API is running' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all waste items
app.get('/api/items', authenticateToken, (req, res) => {
  try {
    res.json({
      items: wasteItems,
      total: wasteItems.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single waste item
app.get('/api/items/:id', authenticateToken, (req, res) => {
  try {
    const item = wasteItems.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new waste item
app.post('/api/items', authenticateToken, (req, res) => {
  try {
    const { type, quantity, unit, location, clientId, clientName, collectionDate } = req.body;

    // Validation
    if (!type || !quantity || !unit || !location || !clientId || !clientName) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, quantity, unit, location, clientId, clientName' 
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const newItem = {
      id: uuidv4(),
      type,
      quantity: parseInt(quantity),
      unit,
      location,
      clientId,
      clientName,
      status: 'pending',
      collectionDate: collectionDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    wasteItems.push(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update waste item
app.put('/api/items/:id', authenticateToken, (req, res) => {
  try {
    const itemIndex = wasteItems.findIndex(i => i.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { type, quantity, unit, location, clientId, clientName, status, collectionDate } = req.body;

    // Validate quantity if provided
    if (quantity !== undefined && quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'collected', 'processing', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const updatedItem = {
      ...wasteItems[itemIndex],
      ...(type && { type }),
      ...(quantity && { quantity: parseInt(quantity) }),
      ...(unit && { unit }),
      ...(location && { location }),
      ...(clientId && { clientId }),
      ...(clientName && { clientName }),
      ...(status && { status }),
      ...(collectionDate !== undefined && { collectionDate }),
      updatedAt: new Date().toISOString()
    };

    wasteItems[itemIndex] = updatedItem;
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete waste item
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  try {
    const itemIndex = wasteItems.findIndex(i => i.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deletedItem = wasteItems.splice(itemIndex, 1)[0];
    res.json({ message: 'Item deleted successfully', item: deletedItem });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 REM Waste Management API running on port ${PORT}`);
});

module.exports = app;