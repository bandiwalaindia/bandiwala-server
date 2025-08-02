const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
const URI = process.env.MONGO_URL || "mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority";
mongoose.connect(URI);
console.log('✅ Connected to database:', URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  isVerified: Boolean,
  cart: {
    items: [{
      menuItemId: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      notes: String,
      selectedSubcategory: {
        title: String,
        quantity: String,
        price: Number
      },
      name: String,
      image: String,
      vendorId: String,
      vendorName: String
    }]
  }
});

const User = mongoose.model('User', userSchema);

async function clearCart() {
  try {
    console.log('🧹 Clearing cart for user: gurramkarthik2006@gmail.com');
    
    const result = await User.updateOne(
      { email: 'gurramkarthik2006@gmail.com' },
      { $set: { 'cart.items': [] } }
    );
    
    console.log('✅ Cart cleared successfully');
    console.log('Modified count:', result.modifiedCount);
    
    // Verify the cart is empty
    const user = await User.findOne({ email: 'gurramkarthik2006@gmail.com' });
    console.log('🛒 Cart items count after clearing:', user.cart?.items?.length || 0);
    
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

clearCart();
