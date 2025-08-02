import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import MenuItem from '../models/MenuItem.js';
import PromoCode from '../models/PromoCode.js';
import { User } from '../models/usermodel.js';
import { generateMenuItemSlug } from '../utils/slugUtils.js';

export const seedData = async () => {
  try {
    console.log('Starting data seeding...');

    // Create vendor users first - using User.create() to ensure password hashing
    const vendorUsersData = [
      {
        name: "Jai Bhavani Chat Owner",
        email: "jaibhavani@bandiwala.com",
        phone: "+919876543210",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true, 
      },
      {
        name: "Shree Ganesh Owner",
        email: "shreeganesh@bandiwala.com",
        phone: "+919876543211",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true, 
      },
      {
        name: "Laxmi Bhavani Owner",
        email: "laxmibhavani@bandiwala.com",
        phone: "+919876543212",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true, 
      },
      {
        name: "Sangamesh Bhavani Owner",
        email: "sangamesh@bandiwala.com",
        phone: "+919876543213",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true,
      },
      {
        name: "Amma Hot Soups Owner",
        email: "ammahotsoups@bandiwala.com",
        phone: "+919876543214",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true,
      },
      {
        name: "Apsara Bandam Milk Owner",
        email: "apsarabandammilk@bandiwala.com",
        phone: "+919876543215",
        password: "vendor123",
        role: "vendor",
        accountVerified: true,
        isApproved: true,
      },
      {
      name: "Rahem Pulav Owner",
      email: "rahempulav@bandiwala.com",
      phone: "+919876543216",
      password: "vendor123",
      role: "vendor",
      accountVerified: true,
      isApproved: true,
    },
    {
      name: "Sai Mumbai Owner",
      email: "saimumbai@bandiwala.com",
      phone: "+919876543217",
      password: "vendor123",
      role: "vendor",
      accountVerified: true,
      isApproved: true,
    },
    {
      name: "Marteru vari Leela chicken pakodi",
      email: "MarteruvariLeelachickenpakodi@bandiwala.com",
      phone: "+919876543218",
      password: "vendor123",
      role: "vendor",
      accountVerified: true,
      isApproved: true,
    },
    {
      name: "Amalapuram vaari nethi bobatlu Owner",
      email: "Amalapuram vaari nethi bobatlu@bandiwala.com",
      phone: "+919876543219",
      password: "vendor123",
      role: "vendor",
      accountVerified: true,
      isApproved: true,
    }
    ];

    // Create users one by one to ensure password hashing middleware runs
    const vendorUsers = [];
    for (const userData of vendorUsersData) {
      const user = await User.create(userData);
      vendorUsers.push(user);
    }

    console.log(`${vendorUsers.length} vendor users created`);

    // Create vendors with linked user accounts
    const vendors = await Vendor.insertMany([
      {
        name: "Jai Bhavani Chat Bhandar",
        description: "Your go-to for authentic Indian street food chats & pani puri.",
        slug: "bhavani-street-food",
        rating: 4.5,
        location: "https://maps.app.goo.gl/K4ukR2zXSH7QL1fb9?g_st=aw",
        phone: "+91 98765 43210",
        image: "/bandiwala-items-pics/vendors/jaibhavani.jpeg",
        deliveryTime: "20-30 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[0]._id, // Link to vendor user
      },
      {
        name: "BFC Chicken Pakodi Center",
        description: "Specializing in delicious chicken pakodis and a selection of other chicken and fish preparations.",
        slug: "BFC-Chicken-Pakodi-Center",
        rating: 4.3,
        location: "https://maps.app.goo.gl/nAyssp8JmJEgmha56?g_st=aw",
        phone: "+91 87654 32109",
        image: "/bandiwala-items-pics/vendors/bfc.jpeg",
        deliveryTime: "20-30 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[1]._id, // Link to vendor user
      },
      {
        name: "Rajahmundry vari Special Muntha Masala",
        description: "Crave local flavors? We offer a wide array of specialty bajjis and unique muntha masala dishes.",
        slug: "Rajahmundry-vari-Special-Muntha-Masala",
        rating: 4.7,
        location: "https://maps.app.goo.gl/SR28akQWeZr1hggk6?g_st=aw",
        phone: "+91 76543 21098",
        image: "/bandiwala-items-pics/vendors/rajamandri.jpeg",
        deliveryTime: "20-30 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[2]._id, // Link to vendor user
      },
      {
        name: "Sangamesh Bhavani Fast Food",
        description: "Serving up popular Chinese noodles, fried rice, and more for a quick and satisfying meal.",
        slug: "Sangamesh-Bhavani-Fast-Food",
        rating: 4.4,
        location: "https://maps.app.goo.gl/YyTZPdPyuhqs49kj6?g_st=aw",
        phone: "+91 65432 10987",
        image: "/bandiwala-items-pics/vendors/sangamesh.jpeg",
        deliveryTime: "20-30 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[3]._id, // Link to vendor user
      },
      {
        name: "Amma Hot Soups",
        description: "Do you eat or drink soups",
        slug: "amma-hot-soups",
        rating: 4.2,
        location: "shop no 4 kphb phase1",
        phone: "+91 98765 43214",
        image: "/bandiwala-items-pics/vendors/amma.jpeg",
        deliveryTime: "15-25 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[4]._id, // Link to vendor user
      },
      {
        name: "Apsara Bandam Milk",
        description: "Get ready to indulge in the rich, creamy goodness of Apsara Badam Milk",
        slug: "apsara-bandam-milk",
        rating: 4.6,
        location: "HIG-76, eSeva Ln, K P H B Phase 3",
        phone: "+91 98765 43215",
        image: "/bandiwala-items-pics/vendors/apsara.jpeg",
        deliveryTime: "10-20 min",
        deliveryFee: 20,
        minOrderValue: 0,
        isActive: true,
        userId: vendorUsers[5]._id, // Link to vendor user
      },
      {
      name: "Rahem Pulav",
      description: "Get ready for delicious Pulav",
      slug: "rahem-pulav",
      rating: 4.5,
      location: "F9QV+F52, K P H B Phase 3",
      phone: "+91 98765 43216",
      image: "/bandiwala-items-pics/vendors/Raheem Pulao.jpeg",
      deliveryTime: "25-35 min",
      deliveryFee: 20,
      minOrderValue: 0,
      isActive: true,
      userId: vendorUsers[6]._id,
    },
    {
      name: "Sai Mumbai Famous Vada Pav & Pav Bhaji",
      description: "Bite into tradition, Taste the Pass",
      slug: "sai-mumbai-vada-pav",
      rating: 4.6,
      location: "K P H B Phase 3",
      phone: "+91 98765 43217",
      image: "/bandiwala-items-pics/vendors/Sai Mumbai famous.jpeg",
      deliveryTime: "20-30 min",
      deliveryFee: 20,
      minOrderValue: 0,
      isActive: true,
      userId: vendorUsers[7]._id,
    },
    {
      name: "Marteru vari Leela chicken pakodi",
      description: "Authentic Filipino flavors with a modern twist",
      slug: "green-modern-filipino",
      rating: 4.4,
      location: "K P H B Phase 3",
      phone: "+91 98765 43218",
      image: "/bandiwala-items-pics/vendors/Marteru vari Leela chicken pakodi.jpeg",
      deliveryTime: "30-40 min",
      deliveryFee: 25,
      minOrderValue: 0,
      isActive: true,
      userId: vendorUsers[8]._id,
    },
    {
      name: "Amalapuram vaari nethi bobatlu",
      description: "Traditional sweet delicacies",
      slug: "Amalapuram vaari nethi bobatlu",
      rating: 4.7,
      location: "K P H B Phase 3",
      phone: "+91 98765 43219",
      image: "/bandiwala-items-pics/vendors/Amalapuram vaari nethi bobatlu.jpeg",
      deliveryTime: "15-25 min",
      deliveryFee: 15,
      minOrderValue: 0,
      isActive: true,
      userId: vendorUsers[9]._id,
    }
    ]);

    console.log(`${vendors.length} vendors created`);

    // Create menu items with proper vendor references
    const menuItemsData = [
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Papidi",
        "itemName": "Dahi Papdi",
        "slug": generateMenuItemSlug("Dahi Papdi"),
        "description": "Crispy papdi topped with yogurt, chutneys and spices",
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/dahi papdi.jpg",
        "isAvailable": true,
        "subcategories": [
          {
            "title": "unit",
            "quantity": "unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Pani Puri (6 pcs)",
        "slug": generateMenuItemSlug("Pani Puri (6 pcs)"),
        "description": "Crispy puris filled with spicy water and chutneys",
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/pani puri.jpeg",
        "isAvailable": true,
        "subcategories": [
          {
            "title": "6 pcs",
            "quantity": "6 Pcs",
            "price": 25
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Sevi Puri",
        "slug": generateMenuItemSlug("Sevi Puri"),
        "description": "Crispy puris topped with sev, chutneys and vegetables",
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/sev puri.jpg",
        "isAvailable": true,
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Bhel Puri",
        "slug": generateMenuItemSlug("Bhel Puri"),
        "description": "Popular Mumbai street food with puffed rice and chutneys",
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/bhel puri.jpeg",
        "isAvailable": true,
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Dahi Puri",
        "slug": generateMenuItemSlug("Dahi Puri"),
        "description": "Puris filled with yogurt, chutneys and spices",
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/dahi puri.jpg",
        "isAvailable": true,
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Sweet Puri",
        "description": "Sweet and tangy puris with special chutneys",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Sweet Puri"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/sweet puri.jpg",
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Masala Puri",
        "description": "Spicy masala puris with aromatic spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Masala Puri"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/Masalapuri.jpg",
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Pani Puri",
        "itemName": "Lemon Puri",
        "description": "Tangy lemon flavored puris with fresh herbs",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Lemon Puri"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/lemon puri.jpg",
        "subcategories": [
          {
            "title": "7 Pcs",
            "quantity": "7 Pcs",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Chat",
        "itemName": "Papdi Chat",
        "description": "Crispy papdi chat with yogurt and chutneys",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Papdi Chat"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/papdi chat.jpg",
        "subcategories": [
          {
            "title": "1 unit",
            "quantity": "1 unit",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Chat",
        "itemName": "Samosa Chat",
        "description": "Crispy samosa topped with chutneys and spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Samosa Chat"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/samosa chat.jpg",
        "subcategories": [
          {
            "title": "1 unit",
            "quantity": "1 unit",
            "price": 40
          }
        ]
      },
      {
        "vendorId": vendors[0]._id,
        "itemCategory": "Chat",
        "itemName": "Aloo Chat",
        "description": "Spicy potato chat with tangy chutneys",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Aloo Chat"),
        "image": "/bandiwala-items-pics/items/Jai Bhavani Chat/aloo chat.jpg",
        "subcategories": [
          {
            "title": "1 unit",
            "quantity": "1 unit",
            "price": 40
          }
        ]
      },

      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Pakodi",
        "itemName": "CHICKEN PAKODI (Bone)",
        "description": "Crispy chicken pakodi with bone, perfectly spiced",
        "isAvailable": true,
        "slug": generateMenuItemSlug("CHICKEN PAKODI (Bone)"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Chicken pakodi_chicken bone.jpg",
        "subcategories": [
          {
            "title": "250 gr",
            "quantity": "Chicken Pakodi 250 gr",
            "price": 155
          },
          {
            "title": "500 gr",
            "quantity": "Chicken Pakodi 500 gr",
            "price": 305
          },
          {
            "title": "750 gr",
            "quantity": "Chicken Pakodi 750 gr",
            "price": 455
          },
          {
            "title": "1 Kg",
            "quantity": "Chicken Pakodi 1 Kg",
            "price": 605
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Pakodi",
        "itemName": "CHICKEN PAKODI (Boneless)",
        "description": "Tender boneless chicken pakodi with aromatic spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("CHICKEN PAKODI (Boneless)"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Chicken pakodi _ boneless.jpg",
        "subcategories": [
          {
            "title": "250 gr",
            "quantity": "Chicken Pakodi 250 gr",
            "price": 205
          },
          {
            "title": "500 gr",
            "quantity": "Chicken Pakodi 500 gr",
            "price": 405
          },
          {
            "title": "750 gr",
            "quantity": "Chicken Pakodi 750 gr",
            "price": 605
          },
          {
            "title": "1 Kg",
            "quantity": "Chicken Pakodi 1 Kg",
            "price": 805
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Fried",
        "itemName": "CHICKEN WINGS",
        "description": "Crispy fried chicken wings with special masala",
        "isAvailable": true,
        "slug": generateMenuItemSlug("CHICKEN WINGS"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Chicken wings.jpg",
        "subcategories": [
          {
            "title": "250 gr",
            "quantity": "Chicken Wings 250 gr",
            "price": 155
          },
          {
            "title": "500 gr",
            "quantity": "Chicken Wings 500 gr",
            "price": 305
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Fried",
        "itemName": "Chicken Leg Piece",
        "description": "Juicy chicken leg piece, perfectly fried",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Leg Piece"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Chicken Leg piece.jpeg",
        "subcategories": [
          {
            "title": "One Piece",
            "quantity": "One Piece",
            "price": 75
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Fried",
        "itemName": "Chicken Joint",
        "description": "Tender chicken joint with crispy coating",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Joint"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Chicken Joint.jpeg",
        "subcategories": [
          {
            "title": "One Piece",
            "quantity": "One Piece",
            "price": 105
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Chicken Fried",
        "itemName": "Kandanakaya (Chicken Gizzards)",
        "description": "Spicy chicken gizzards, a local delicacy",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Kandanakaya (Chicken Gizzards)"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Kandankaya fry.png",
        "subcategories": [
          {
            "title": "300 gms",
            "quantity": "300 gms",
            "price": 155
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Fish items / Sea foods",
        "itemName": "Fish Cut Pieces (Rava)",
        "description": "Fresh fish pieces coated in rava and fried",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Fish Cut Pieces (Rava)"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Fish cut pieces.jpg",
        "subcategories": [
          {
            "title": "1 Pc",
            "quantity": "1 Pc",
            "price": 85
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Fish items / Sea foods",
        "itemName": "Thilapi Goraka",
        "description": "Traditional fish preparation with special spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Thilapi Goraka"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Tilapi Fish.jpg",
        "subcategories": [
          {
            "title": "1 Pc",
            "quantity": "1 Pc",
            "price": 155
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Fish items / Sea foods",
        "itemName": "Prawns Fry",
        "description": "Fresh prawns fried to perfection with spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Prawns Fry"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Prawns fry.png",
        "subcategories": [
          {
            "title": "250 gr",
            "quantity": "250 gr",
            "price": 255
          },
          {
            "title": "500G",
            "quantity": "500G",
            "price": 505
          }
        ]
      },
      {
        "vendorId": vendors[1]._id,
        "itemCategory": "Fish items / Sea foods",
        "itemName": "Methallu",
        "description": "Traditional fish preparation, crispy and flavorful",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Methallu"),
        "image": "/bandiwala-items-pics/items/BFC Chicken pakodi/Mettalu fry.jpg",
        "subcategories": [
          {
            "title": "250Gms",
            "quantity": "250Gms",
            "price": 205
          }
        ]
      },

      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Mirchi Bajji (With onion stuffing)",
        "description": "Spicy green chili bajji stuffed with onions",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Mirchi Bajji (With onion stuffing)"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/Mirchi bajji.png",
        "subcategories": [
          {
            "title": "4pcs",
            "quantity": "4pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Aratikaya Bajji",
        "description": "Crispy banana bajji, a traditional favorite",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Aratikaya Bajji"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/Aratikaya Bajji.png",
        "subcategories": [
          {
            "title": "4pcs",
            "quantity": "4pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Aloo Bajji",
        "description": "Potato bajji with perfect crispy coating",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Aloo Bajji"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/Aloo bajji.jpg",
        "subcategories": [
          {
            "title": "4pcs",
            "quantity": "4pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Vankaya Bajji",
        "description": "Eggplant bajji served with special mixture",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Vankaya Bajji"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/Vankaya bajji.jpg",
        "subcategories": [
          {
            "title": "1 Piece with Mixture",
            "quantity": "1 Piece with Mixture",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Tomato Bajji",
        "description": "Tangy tomato bajji with aromatic spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Tomato Bajji"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/tomato bajji.jpg",
        "subcategories": [
          {
            "title": "2 cups",
            "quantity": "2 cups",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Bajjis",
        "itemName": "Egg Bajji",
        "description": "Boiled egg bajji with crispy batter coating",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Egg Bajji"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/egg bajji.jpg",
        "subcategories": [
          {
            "title": "1 Piece With mixture",
            "quantity": "1 Piece With mixture",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Vada",
        "itemName": "Masala Vada",
        "description": "Crispy lentil vada with aromatic spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Masala Vada"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Masala wada.jpeg",
        "subcategories": [
          {
            "title": "4pcs",
            "quantity": "4pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Punugulu",
        "itemName": "Punugulu",
        "description": "Traditional Andhra snack, crispy and delicious",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Punugulu"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/punugulu.jpg",
        "subcategories": [
          {
            "title": "15pcs",
            "quantity": "15pcs",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Mirchi Bajji Muntha Masala",
        "description": "Spicy mirchi bajji with special muntha masala",
        "isAvailable": true,
        "slug": "mirchi-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mirchi bajji mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Aritikaya Bajji Muntha Masala",
        "description": "Banana bajji with traditional muntha masala",
        "isAvailable": true,
        "slug": "aritikaya-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Muntha Masala/Aratikaya bajji muntha masala.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Aloo Bajji Muntha Masala",
        "description": "Potato bajji with aromatic muntha masala",
        "isAvailable": true,
        "slug": "aloo-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Muntha Masala/AAlu bajji muntha masala.avif",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Vankaya Bajji Muntha Masala",
        "description": "Eggplant bajji with special muntha masala",
        "isAvailable": true,
        "slug": "vankaya-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Muntha Masala/vankaya bajji muntha masala.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Tomato Bajji Muntha Masala",
        "description": "Tomato bajji with tangy muntha masala",
        "isAvailable": true,
        "slug": "tomato-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Muntha Masala/tamato bajji muntha masala.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Egg Bajji Muntha Masala",
        "description": "Egg bajji with flavorful muntha masala",
        "isAvailable": true,
        "slug": "egg-bajji-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Muntha Masala/egg bajji muntha masala.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Muntha masala",
        "itemName": "Masala Vada Muntha Masala",
        "description": "Masala vada with traditional muntha masala",
        "isAvailable": true,
        "slug": "masala-vada-muntha-masala",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Masala wada.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Mirchi Bajji Mixture",
        "description": "Spicy mirchi bajji served with crunchy mixture",
        "isAvailable": true,
        "slug": "mirchi-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Bajji mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Aratikaya Bajji Mixture",
        "description": "Banana bajji with traditional mixture",
        "isAvailable": true,
        "slug": "aratikaya-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Bajji mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Aloo Bajji Mixture",
        "description": "Potato bajji with aromatic mixture",
        "isAvailable": true,
        "slug": "aloo-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Bajji mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Vankaya Bajji Mixture",
        "description": "Eggplant bajji with special mixture",
        "isAvailable": true,
        "slug": "vankaya-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Vnakay bajji mixture.png",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Tomato Bajji Mixture",
        "description": "Tomato bajji with tangy mixture",
        "isAvailable": true,
        "slug": "tomato-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Tomato mixture & all other mixtures.avif",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Egg Bajji Mixture",
        "description": "Egg bajji with flavorful mixture",
        "isAvailable": true,
        "slug": "egg-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/egg mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Mixtures",
        "itemName": "Masala Vada Bajji Mixture",
        "description": "Masala vada with crunchy mixture",
        "isAvailable": true,
        "slug": "masala-vada-bajji-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Bajji mixture.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Atukula Mixture",
        "itemName": "Atukula Mixture",
        "description": "Traditional rice flakes mixture",
        "isAvailable": true,
        "slug": "atukula-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Tomato mixture & all other mixtures.avif",
        "subcategories": [
          {
            "title": "1 qty",
            "quantity": "1 qty",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Corn Mixture",
        "itemName": "Corn Mixture",
        "description": "Crispy corn mixture with spices",
        "isAvailable": true,
        "slug": "corn-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Tomato mixture & all other mixtures.avif",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Kaju Mixture",
        "itemName": "Kaju Mixture",
        "description": "Premium cashew mixture, rich and crunchy",
        "isAvailable": true,
        "slug": "kaju-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Kaju Mixture.avif",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 85
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Ghee Mixture",
        "itemName": "Ghee Mixture",
        "description": "Traditional mixture prepared in pure ghee",
        "isAvailable": true,
        "slug": "ghee-mixture",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Mixture/Tomato mixture & all other mixtures.avif",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 85
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Mirchi Batani",
        "description": "Spicy mirchi with traditional batani preparation",
        "isAvailable": true,
        "slug": "mirchi-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Mirchi batani.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Aratikaya Batani",
        "description": "Banana with special batani style",
        "isAvailable": true,
        "slug": "aratikaya-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Aratikai Batani.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Aloo Batani",
        "description": "Potato batani with aromatic spices",
        "isAvailable": true,
        "slug": "aloo-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Aloo Batani.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Vankaya Batani",
        "description": "Eggplant batani, traditional preparation",
        "isAvailable": true,
        "slug": "vankaya-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Vankaya batani.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Tomato Batani",
        "description": "Tangy tomato batani with spices",
        "isAvailable": true,
        "slug": "tomato-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Tomato batani.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Egg Batani",
        "description": "Egg batani with flavorful preparation",
        "isAvailable": true,
        "slug": "egg-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/Egg batani.jpeg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Batani",
        "itemName": "Corn Flakes Batani",
        "description": "Crispy corn flakes batani",
        "isAvailable": true,
        "slug": "corn-flakes-batani",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Batni/corn flaksbatani.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 45
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Slices",
        "itemName": "Tomato Slices",
        "description": "Fresh tomato slices with special seasoning",
        "isAvailable": true,
        "slug": "tomato-slices",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/Tomato slices.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[2]._id,
        "itemCategory": "Slices",
        "itemName": "Egg Slices",
        "description": "Boiled egg slices with aromatic spices",
        "isAvailable": true,
        "slug": "egg-slices",
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/egg slices.jpg",
        "subcategories": [
          {
            "title": "1 Unit",
            "quantity": "1 Unit",
            "price": 55
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Noodles",
        "itemName": "VEG NOODLES",
        "description": "Delicious vegetable noodles with mixed vegetables",
        "isAvailable": true,
        "slug": "veg-noodles",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/veg noodles.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 65
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 105
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Noodles",
        "itemName": "EGG NOODLES",
        "description": "Tasty egg noodles with scrambled eggs",
        "isAvailable": true,
        "slug": "egg-noodles",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/egg noodles.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 75
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 125
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Noodles",
        "itemName": "CHICKEN NOODLES",
        "description": "Spicy chicken noodles with tender chicken pieces",
        "isAvailable": true,
        "slug": "chicken-noodles",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken noodles.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Noodles",
        "itemName": "DOUBLE EGG CHICKEN NOODLES",
        "description": "Chicken noodles with extra eggs",
        "isAvailable": true,
        "slug": "double-egg-chicken-noodles",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken noodles.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 95
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 155
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Noodles",
        "itemName": "DOUBLE EGG NOODLES",
        "description": "Egg noodles with double portion of eggs",
        "isAvailable": true,
        "slug": "double-egg-noodles",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/egg noodles.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "VEG FRIED RICE",
        "description": "Aromatic vegetable fried rice with mixed vegetables",
        "isAvailable": true,
        "slug": "veg-fried-rice",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/veg fried rice.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 65
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 105
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "EGG FRIED RICE",
        "description": "Delicious egg fried rice with scrambled eggs",
        "isAvailable": true,
        "slug": "egg-fried-rice",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/egg fried ice.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 75
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 125
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "CHICKEN FRIED RICE",
        "description": "Flavorful chicken fried rice with tender chicken",
        "isAvailable": true,
        "slug": generateMenuItemSlug("CHICKEN FRIED RICE"),
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken fried rice.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "DOUBLE EGG CHICKEN FRIED RICE",
        "description": "Chicken fried rice with extra eggs",
        "isAvailable": true,
        "slug": "double-egg-chicken-fried-rice",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken fried rice(1).jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 95
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 155
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "DOUBLE EGG FRIED RICE",
        "description": "Egg fried rice with double portion of eggs",
        "isAvailable": true,
        "slug": "double-egg-fried-rice",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/egg fried ice.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Fried rice",
        "itemName": "VEG MANCHURIAN FRIED RICE",
        "description": "Fried rice with vegetable manchurian",
        "isAvailable": true,
        "slug": "veg-manchurian-fried-rice",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/veg manchurian rice.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 75
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 135
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "CHICKEN MANCHURIAN",
        "description": "Spicy chicken manchurian with aromatic sauce",
        "isAvailable": true,
        "slug": "chicken-manchurian",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken manchurian.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 105
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 195
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "VEG MANCHURIAN",
        "description": "Crispy vegetable manchurian with tangy sauce",
        "isAvailable": true,
        "slug": "veg-manchurian",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/veg manchurian.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 65
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 115
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "CHICKEN 65",
        "description": "Famous South Indian chicken 65, spicy and crispy",
        "isAvailable": true,
        "slug": "chicken-65",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chicken 65.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 135
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 225
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "CHILLY CHICKEN",
        "description": "Indo-Chinese chilly chicken with peppers",
        "isAvailable": true,
        "slug": "chilly-chicken",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/chill chicken.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 135
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 225
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "EGG MANCHURIAN",
        "description": "Unique egg manchurian with special sauce",
        "isAvailable": true,
        "slug": "egg-manchurian",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/egg manchurian.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },
      {
        "vendorId": vendors[3]._id,
        "itemCategory": "Manchurian",
        "itemName": "VEG 65",
        "description": "Vegetarian version of the famous 65 preparation",
        "isAvailable": true,
        "slug": "veg-65",
        "image": "/bandiwala-items-pics/items/Snagamesh Lkashmi bahavani fast food/veg 65.jpg",
        "subcategories": [
          {
            "title": "Half plate",
            "quantity": "Half plate",
            "price": 85
          },
          {
            "title": "Full Plate",
            "quantity": "Full Plate",
            "price": 145
          }
        ]
      },

      // Amma Hot Soups Menu Items
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Mushroom Soup",
        "description": "Fresh mushroom soup with aromatic herbs",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Mushroom Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Mushroom soup.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Sweet Corn Soup",
        "description": "Creamy sweet corn soup with vegetables",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Sweet Corn Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Sweet corn soup.jpeg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Tomato soup",
        "description": "Classic tomato soup with fresh herbs",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Tomato soup"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/tomato bajji.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Vegetable Soup",
        "description": "Mixed vegetable soup with seasonal vegetables",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Vegetable Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Vegitable soups.JPG",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Hot & Soup",
        "description": "Spicy hot soup with vegetables",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Hot & Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Hot-and-Sour-Soup-3-500x375.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Veg Soups",
        "itemName": "Veg Manchow Soup",
        "description": "Indo-Chinese style vegetable manchow soup",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Veg Manchow Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Veg manchow soup.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 70
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Chicken Soup",
        "itemName": "Chicken Hot Soup",
        "description": "Spicy hot chicken soup with tender pieces",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Hot Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/chicken hot soup.jpeg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 70
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Chicken Soup",
        "itemName": "Chicken Corn Soup",
        "description": "Chicken soup with sweet corn and herbs",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Corn Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/Chicken corn soup.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 80
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Chicken Soup",
        "itemName": "Chicken Pakods Soup",
        "description": "Chicken soup with crispy pakodas",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Pakods Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/chicken pakoda soup.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 90
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Chicken Soup",
        "itemName": "Chicken Manchow Soup",
        "description": "Indo-Chinese style chicken manchow soup",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Chicken Manchow Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/chicken manchow.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 90
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Mutton Soup",
        "itemName": "Mutton Bone Soup",
        "description": "Rich mutton bone soup with aromatic spices",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Mutton Bone Soup"),
        "image": "/bandiwala-items-pics/items/Amma soups/mutton bone soup.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 99
          }
        ]
      },
      {
        "vendorId": vendors[4]._id,
        "itemCategory": "Egg soup",
        "itemName": "Egg soup",
        "description": "Comforting egg soup with vegetables",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Egg soup"),
        "image": "/bandiwala-items-pics/items/Rajabundry Vaari special muntha masala/BAJJI/egg bajji.jpg",
        "subcategories": [
          {
            "title": "1 Bowl",
            "quantity": "1 Bowl",
            "price": 80
          }
        ]
      },

      // Apsara Bandam Milk Menu Items
      {
        "vendorId": vendors[5]._id,
        "itemCategory": "Bandam Milk",
        "itemName": "Plain Badam Milk",
        "description": "Rich and creamy plain badam milk",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Plain Badam Milk"),
        "image": "/bandiwala-items-pics/items/apsara/Kesar-Pista-Badaam-Milk.jpeg",
        "subcategories": [
          {
            "title": "1 Glass",
            "quantity": "1 Glass",
            "price": 60
          }
        ]
      },
      {
        "vendorId": vendors[5]._id,
        "itemCategory": "Bandam Milk",
        "itemName": "kova Ice Cream",
        "description": "Delicious kova flavored ice cream",
        "isAvailable": true,
        "slug": generateMenuItemSlug("kova Ice Cream"),
        "image": "/bandiwala-items-pics/items/apsara/kovaIceCream.jpeg",
        "subcategories": [
          {
            "title": "1 Scoop",
            "quantity": "1 Scoop",
            "price": 70
          }
        ]
      },
      {
        "vendorId": vendors[5]._id,
        "itemCategory": "Bandam Milk",
        "itemName": "Kova Badam Milk",
        "description": "Premium kova badam milk with rich texture",
        "isAvailable": true,
        "slug": generateMenuItemSlug("Kova Badam Milk"),
        "image": "/bandiwala-items-pics/items/apsara/KovaBadamMilk.jpeg",
        "subcategories": [
          {
            "title": "1 Glass",
            "quantity": "1 Glass",
            "price": 70
          }
        ]
      },
      // Rahem Pulav Menu Items
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Chicken",
    "itemName": "Chicken Dum Pulav",
    "slug": generateMenuItemSlug("Chicken Dum Pulav"),
    "description": "Flavorful chicken dum pulav with aromatic spices",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Chicken Dum Pulav.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 135
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Chicken",
    "itemName": "Chicken Fry Pulav",
    "slug": generateMenuItemSlug("Chicken Fry Pulav"),
    "description": "Delicious chicken fry pulav with crispy chicken",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Chicken Fry Pulav.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 145
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Chicken",
    "itemName": "Chicken Dum Biriyani",
    "slug": generateMenuItemSlug("Chicken Dum Biriyani"),
    "description": "Authentic chicken dum biriyani with rich flavors",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Chicken Dum Biryani.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Chicken",
    "itemName": "Chicken Fry Biriyani",
    "slug": generateMenuItemSlug("Chicken Fry Biriyani"),
    "description": "Special chicken fry biriyani with golden fried chicken",
    "image": "/bandiwala-items-pics/items/RaheemPulao/chicken-fry-piece-biryani.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 165
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Mutton",
    "itemName": "Mutton Fry Pulav",
    "slug": generateMenuItemSlug("Mutton Fry Pulav"),
    "description": "Rich mutton fry pulav with tender meat",
    "image": "/bandiwala-items-pics/items/RaheemPulao/mutton fry pulav.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 255
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Mutton",
    "itemName": "Mutton Fry Biriyani",
    "slug": generateMenuItemSlug("Mutton Fry Biriyani"),
    "description": "Premium mutton fry biriyani with aromatic spices",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Muton Biriyani.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 285
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Prawns",
    "itemName": "Prawns Fry Pulav",
    "slug": generateMenuItemSlug("Prawns Fry Pulav"),
    "description": "Delicious prawns fry pulav with fresh seafood",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Chicken Pulav.png",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 275
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Prawns",
    "itemName": "Prawns Fry Biriyani",
    "slug": generateMenuItemSlug("Prawns Fry Biriyani"),
    "description": "Exotic prawns fry biriyani with rich flavors",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Chicken Dum Biryani.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 325
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Natukodi",
    "itemName": "Natukodi Curry Pulav",
    "slug": generateMenuItemSlug("Natukodi Curry Pulav"),
    "description": "Country chicken curry pulav with authentic taste",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Natukoddi curry pulav.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 275
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Natukodi",
    "itemName": "Natukodu Curry Biriyani",
    "slug": generateMenuItemSlug("Natukodu Curry Biriyani"),
    "description": "Country chicken curry biriyani with rich flavors",
    "image": "/bandiwala-items-pics/items/RaheemPulao/natukoddi biriyani.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 275
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Special Combos",
    "itemName": "Ragi Sangati & Natukodi",
    "slug": generateMenuItemSlug("Ragi Sangati & Natukodi"),
    "description": "Healthy ragi sangati with country chicken curry",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Natukoddi curry pulav.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 215
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Special Combos",
    "itemName": "Chepala Pulusu & Ragi Sangati",
    "slug": generateMenuItemSlug("Chepala Pulusu & Ragi Sangati"),
    "description": "Fish curry with healthy ragi sangati",
    "image": "/bandiwala-items-pics/items/RaheemPulao/chicken curry.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 275
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Side Dishes",
    "itemName": "Mutton Fry",
    "slug": generateMenuItemSlug("Mutton Fry"),
    "description": "Crispy fried mutton pieces with spices",
    "image": "/bandiwala-items-pics/items/RaheemPulao/Mutton fry.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 255
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Side Dishes",
    "itemName": "Chicken Fry",
    "slug": generateMenuItemSlug("Chicken Fry"),
    "description": "Crispy fried chicken pieces with spices",
    "image": "/bandiwala-items-pics/items/RaheemPulao/chicken curry.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 125
      }
    ]
  },
  {
    "vendorId": vendors[6]._id,
    "itemCategory": "Side Dishes",
    "itemName": "Chepala Pulusu",
    "slug": generateMenuItemSlug("Chepala Pulusu"),
    "description": "Traditional fish curry with rich flavors",
    "image": "/bandiwala-items-pics/items/RaheemPulao/chicken curry.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 185
      }
    ]
  },

  // Sai Mumbai Famous Vada Pav & Pav Bhaji Menu Items
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Breakfast",
    "itemName": "Poha-Atukulu",
    "slug": generateMenuItemSlug("Poha-Atukulu"),
    "description": "Traditional flattened rice breakfast dish",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Poha.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 55
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Vada Pav",
    "itemName": "Vada Pav 1pc",
    "slug": generateMenuItemSlug("Vada Pav 1pc"),
    "description": "Classic Mumbai street food - spiced potato fritter in bun",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "1 Piece",
        "quantity": "1 Piece",
        "price": 20
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Vada Pav",
    "itemName": "Vada Pav 2pc",
    "slug": generateMenuItemSlug("Vada Pav 2pc"),
    "description": "Two pieces of classic Mumbai vada pav",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "2 Pieces",
        "quantity": "2 Pieces",
        "price": 40
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Vada Pav",
    "itemName": "Bread vada 1pc",
    "slug": generateMenuItemSlug("Bread vada 1pc"),
    "description": "Vada served in bread slices with chutneys",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "1 Piece",
        "quantity": "1 Piece",
        "price": 25
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Vada Pav",
    "itemName": "Bread vada 2pc",
    "slug": generateMenuItemSlug("Bread vada 2pc"),
    "description": "Two pieces of vada served in bread slices",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "2 Pieces",
        "quantity": "2 Pieces",
        "price": 55
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Bajji",
    "itemName": "Palak Bajji",
    "slug": generateMenuItemSlug("Palak Bajji"),
    "description": "Crispy spinach fritters",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Palak Pokora.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 35
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Bajji",
    "itemName": "Mirchi Bajji",
    "slug": generateMenuItemSlug("Mirchi Bajji"),
    "description": "Spicy chili fritters",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Mirchi Bhajji.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 35
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Bajji",
    "itemName": "Onion Bajji",
    "slug": generateMenuItemSlug("Onion Bajji"),
    "description": "Crispy onion fritters",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Onion Bhajji.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 45
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Bajji",
    "itemName": "Aloo Bajji",
    "slug": generateMenuItemSlug("Aloo Bajji"),
    "description": "Potato fritters with spices",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Aloo Pakora.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 35
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Misal Pav",
    "slug": generateMenuItemSlug("Misal Pav"),
    "description": "Spicy sprouted curry served with bread",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Misal Pav.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Special Misal Pav",
    "slug": generateMenuItemSlug("Special Misal Pav"),
    "description": "Premium version of misal pav with extra toppings",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Misal Pav.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Rasa Vada",
    "slug": generateMenuItemSlug("Rasa Vada"),
    "description": "Vada served in spicy gravy",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Special Rasa Vada",
    "slug": generateMenuItemSlug("Special Rasa Vada"),
    "description": "Premium version of rasa vada with extra toppings",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Pav Bhaji",
    "slug": generateMenuItemSlug("Pav Bhaji"),
    "description": "Classic Mumbai mashed vegetable curry with bread",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Pav Bhaji.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Pav Bhaji",
    "itemName": "Special Pav Bhaji",
    "slug": generateMenuItemSlug("Special Pav Bhaji"),
    "description": "Premium version of pav bhaji with extra butter",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Pav Bhaji.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Special Items",
    "itemName": "Saggubiyam Vada",
    "slug": generateMenuItemSlug("Saggubiyam Vada"),
    "description": "Sago pearl vada, crispy and delicious",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 65
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Special Items",
    "itemName": "Special Saggubiyam",
    "slug": generateMenuItemSlug("Special Saggubiyam"),
    "description": "Premium version of sago pearl vada",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Special Items",
    "itemName": "Saggubiyam Khichadi",
    "slug": generateMenuItemSlug("Saggubiyam Khichadi"),
    "description": "Sago pearl khichadi, a unique preparation",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Poha.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 65
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Special Items",
    "itemName": "Special Saggubiyam Khichadi",
    "slug": generateMenuItemSlug("Special Saggubiyam Khichadi"),
    "description": "Premium version of sago pearl khichadi",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Poha.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Extras",
    "itemName": "Extra Pav",
    "slug": generateMenuItemSlug("Extra Pav"),
    "description": "Additional bread pieces",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Bread Pakoda.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Piece",
        "quantity": "Piece",
        "price": 10
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Snacks",
    "itemName": "Murmura Mixture",
    "slug": generateMenuItemSlug("Murmura Mixture"),
    "description": "Puffed rice snack with spices and chutneys",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Poha.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 30
      }
    ]
  },
  {
    "vendorId": vendors[7]._id,
    "itemCategory": "Snacks",
    "itemName": "Bhel",
    "slug": generateMenuItemSlug("Bhel"),
    "description": "Classic Mumbai street snack with puffed rice",
    "image": "/bandiwala-items-pics/items/Sai Mumbai famous/Poha.jpg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 35
      }
    ]
  },

  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Chicken Shawarma",
    "slug": generateMenuItemSlug("Chicken Shawarma"),
    "description": "Classic chicken shawarma with garlic sauce",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Chicken shawarma.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Regular",
        "quantity": "Regular",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Shawarma with Cream & Onion Ships (Special)",
    "slug": generateMenuItemSlug("Shawarma with Cream & Onion Ships (Special)"),
    "description": "Special shawarma with cream and crispy onions",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/shawarma with cream & onion ships(special).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Special",
        "quantity": "Special",
        "price": 135
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Shawarma with Fries & Eggs (Special)",
    "slug": generateMenuItemSlug("Shawarma with Fries & Eggs (Special)"),
    "description": "Special shawarma with fries and eggs",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/shawarma with fries & eggs(special).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Special",
        "quantity": "Special",
        "price": 135
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Chicken Pakoda Shawarma",
    "slug": generateMenuItemSlug("Chicken Pakoda Shawarma"),
    "description": "Shawarma with crispy chicken pakoda filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken pakoda shawarma.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Regular",
        "quantity": "Regular",
        "price": 125
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Paneer Shawarma",
    "slug": generateMenuItemSlug("Paneer Shawarma"),
    "description": "Vegetarian shawarma with paneer filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/paneer shawarma.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Regular",
        "quantity": "Regular",
        "price": 125
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Chezy Shawarma",
    "slug": generateMenuItemSlug("Chezy Shawarma"),
    "description": "Extra cheesy shawarma with multiple cheeses",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Chezy shawarma.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Regular",
        "quantity": "Regular",
        "price": 125
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Shawarmas",
    "itemName": "Bowl Shawarma",
    "slug": generateMenuItemSlug("Bowl Shawarma"),
    "description": "Deconstructed shawarma served in a bowl",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Bowl shawarma.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Chicken Pakodi (Boneless and Bone)",
    "slug": generateMenuItemSlug("Chicken Pakodi (Boneless and Bone)"),
    "description": "Crispy chicken pakodi with both boneless and bone pieces",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken pakodi(boneless and bone).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 205
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Cashew Chicken Pakodi (Bone and Boneless)",
    "slug": generateMenuItemSlug("Cashew Chicken Pakodi (Bone and Boneless)"),
    "description": "Premium chicken pakodi with cashew nuts",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/cashew chicken pakodi(bone and boneless).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 235
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Mutton Pakodi",
    "slug": generateMenuItemSlug("Mutton Pakodi"),
    "description": "Rich mutton pakodi with aromatic spices",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Mutton pakodi.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 305
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Fish Pakodi",
    "slug": generateMenuItemSlug("Fish Pakodi"),
    "description": "Crispy fish pakodi with fresh fish",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/fish pakodi.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 255
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Prawns Pakodi",
    "slug": generateMenuItemSlug("Prawns Pakodi"),
    "description": "Delicious prawns pakodi with fresh seafood",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/prawns pakodi.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 235
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Crab Pakodi",
    "slug": generateMenuItemSlug("Crab Pakodi"),
    "description": "Unique crab pakodi with fresh crab meat",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/full fish pakodi.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 205
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Methallu Pakodi",
    "slug": generateMenuItemSlug("Methallu Pakodi"),
    "description": "Traditional methallu fish pakodi",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/methallu pakodi .jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "250 gms",
        "quantity": "250 gms",
        "price": 185
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Full Fish Pakodi",
    "slug": generateMenuItemSlug("Full Fish Pakodi"),
    "description": "Whole fish pakodi with bones",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/full fish pakodi.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Piece",
        "quantity": "Piece",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Live Pakodies (250 gms)",
    "itemName": "Chicken Wings (8) & Lolipops (5-6)",
    "slug": generateMenuItemSlug("Chicken Wings (8) & Lolipops (5-6)"),
    "description": "Combo of chicken wings and lollipops",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken wings(8)&lolipops(5-6).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Combo",
        "quantity": "Combo",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Chicken Biriyani",
    "slug": generateMenuItemSlug("Chicken Biriyani"),
    "description": "Classic chicken biriyani with aromatic rice",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken biriyani.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Regular",
        "quantity": "Regular",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Chicken Dum Biriyani (Medium)",
    "slug": generateMenuItemSlug("Chicken Dum Biriyani (Medium)"),
    "description": "Medium portion of chicken dum biriyani",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Chicken Dum Biriyani (medium).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Medium",
        "quantity": "Medium",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Chicken Dum Biriyani (Plate)",
    "slug": generateMenuItemSlug("Chicken Dum Biriyani (Plate)"),
    "description": "Full plate of chicken dum biriyani",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken Dum Biriyani (plate).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Chicken Fry Piece Biriyani (Medium)",
    "slug": generateMenuItemSlug("Chicken Fry Piece Biriyani (Medium)"),
    "description": "Medium portion of biriyani with fried chicken",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken fry biriyani (medium).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Medium",
        "quantity": "Medium",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Chicken Fry Piece Biriyani (Plate)",
    "slug": generateMenuItemSlug("Chicken Fry Piece Biriyani (Plate)"),
    "description": "Full plate of biriyani with fried chicken",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken fry biriyani (plate).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Mutton Biriyani (Wednesday & Sunday)",
    "slug": generateMenuItemSlug("Mutton Biriyani (Wednesday & Sunday)"),
    "description": "Special mutton biriyani available only on Wednesdays and Sundays",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/mutton biriyani.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 205
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Biriyani",
    "itemName": "Prawns Biriyani",
    "slug": generateMenuItemSlug("Prawns Biriyani"),
    "description": "Delicious prawns biriyani with fresh seafood",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/prawnsbiryani.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Plate",
        "quantity": "Plate",
        "price": 205
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Kya Momos(5)",
    "itemName": "Veg Corn Momos",
    "slug": generateMenuItemSlug("Veg Corn Momos"),
    "description": "Steamed momos with vegetable and corn filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/Veg corn momos.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "5 Pieces",
        "quantity": "5 Pieces",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Kya Momos(5)",
    "itemName": "Veg Paneer Momos",
    "slug": generateMenuItemSlug("Veg Paneer Momos"),
    "description": "Steamed momos with paneer filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/veg paneer momos.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "5 Pieces",
        "quantity": "5 Pieces",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Kya Momos(5)",
    "itemName": "Chicken Momos",
    "slug": generateMenuItemSlug("Chicken Momos"),
    "description": "Steamed momos with chicken filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken momos.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "5 Pieces",
        "quantity": "5 Pieces",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Kya Momos(5)",
    "itemName": "Cheesy Springs Rolls",
    "slug": generateMenuItemSlug("Cheesy Springs Rolls"),
    "description": "Crispy spring rolls with cheese filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/cheesy springs rolls.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "5 Pieces",
        "quantity": "5 Pieces",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Kya Momos(5)",
    "itemName": "Chicken Cheesy Spring Roll",
    "slug": generateMenuItemSlug("Chicken Cheesy Spring Roll"),
    "description": "Crispy spring rolls with chicken and cheese filling",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken cheesy spring roll.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "5 Pieces",
        "quantity": "5 Pieces",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Sambar Rice Bowl",
    "slug": generateMenuItemSlug("Sambar Rice Bowl"),
    "description": "Rice served with sambar in a bowl",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/sambar rice bowl.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 55
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Chicken Rice Bowl",
    "slug": generateMenuItemSlug("Chicken Rice Bowl"),
    "description": "Rice served with chicken curry in a bowl",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken Rice bowl.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 85
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Chicken Pakodi Sambar Rice Bowl",
    "slug": generateMenuItemSlug("Chicken Pakodi Sambar Rice Bowl"),
    "description": "Rice with sambar and chicken pakodi topping",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken pakodi sambar rice bowl.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Chicken Fry Piece & Sambar Rice",
    "slug": generateMenuItemSlug("Chicken Fry Piece & Sambar Rice"),
    "description": "Rice with sambar and fried chicken piece",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken fry peice & sambar rice.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 105
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Mutton Rice Bowl (Sambar Add On)",
    "slug": generateMenuItemSlug("Mutton Rice Bowl (Sambar Add On)"),
    "description": "Rice with mutton curry and optional sambar",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/mutton Rice Bowl(sambar add on).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 175
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Prawns Rice Bowl (Sambar Add On)",
    "slug": generateMenuItemSlug("Prawns Rice Bowl (Sambar Add On)"),
    "description": "Rice with prawns curry and optional sambar",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/prawns rice bowl(sambar add on).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 155
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Rice Bowls",
    "itemName": "Curd Rice Bowl",
    "slug": generateMenuItemSlug("Curd Rice Bowl"),
    "description": "Cooling curd rice served in a bowl",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/curd rice bowl.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Bowl",
        "quantity": "Bowl",
        "price": 55
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Grill Me & Tandoori",
    "itemName": "Chicken Grill (Full)",
    "slug": generateMenuItemSlug("Chicken Grill (Full)"),
    "description": "Full chicken grilled with special marinade",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken grill(full).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Full",
        "quantity": "Full",
        "price": 405
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Grill Me & Tandoori",
    "itemName": "Chicken Grill (Half)",
    "slug": generateMenuItemSlug("Chicken Grill (Half)"),
    "description": "Half chicken grilled with special marinade",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/chicken grill(half).jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Half",
        "quantity": "Half",
        "price": 205
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Mocktails and Drinks",
    "itemName": "Blue Lagoon",
    "slug": generateMenuItemSlug("Blue Lagoon"),
    "description": "Refreshing blue colored mocktail",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/blue lagoon.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Glass",
        "quantity": "Glass",
        "price": 65
      }
    ]
  },
  {
    "vendorId": vendors[8]._id,
    "itemCategory": "Mocktails and Drinks",
    "itemName": "Green Delight Apple",
    "slug": generateMenuItemSlug("Green Delight Apple"),
    "description": "Green apple flavored refreshing drink",
    "image": "/bandiwala-items-pics/items/Marteru vari Leela chicken pakodi/green delight apple.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Glass",
        "quantity": "Glass",
        "price": 65
      }
    ]
  },

  // Amalapuram vaari nethi bobatlu Menu Items
  {
    "vendorId": vendors[9]._id,
    "itemCategory": "Amalapuram vaari nethi bobatlu",
    "itemName": "Bellam Bobbatlu",
    "slug": generateMenuItemSlug("Bellam Bobbatlu"),
    "description": "Traditional sweet with jaggery filling",
    "image": "/bandiwala-items-pics/items/AmalapuramVaariNethiBobatlu/bellam bobatlu.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Piece",
        "quantity": "Piece",
        "price": 20
      }
    ]
  },
  {
    "vendorId": vendors[9]._id,
    "itemCategory": "Amalapuram vaari nethi bobatlu",
    "itemName": "Cova Bobbatlu",
    "slug": generateMenuItemSlug("Cova Bobbatlu"),
    "description": "Premium version with sugar filling",
    "image": "/bandiwala-items-pics/items/AmalapuramVaariNethiBobatlu/kova bobatlu.jpeg",
    "isAvailable": true,
    "subcategories": [
      {
        "title": "Piece",
        "quantity": "Piece",
        "price": 30
      }
    ]
  }
  ];

    // Ensure unique slugs per vendor for all menu items
    menuItemsData.forEach(item => {
      item.slug = generateMenuItemSlug(item.itemName, item.itemCategory, item.vendorId.toString());
    });

    // Insert all menu items at once
    const menuItems = await MenuItem.insertMany(menuItemsData);

    // Count items per vendor for detailed output
    const vendorItemCounts = {};
    menuItems.forEach(item => {
      const vendor = vendors.find(v => v._id.equals(item.vendorId));
      if (vendor) {
        vendorItemCounts[vendor.name] = (vendorItemCounts[vendor.name] || 0) + 1;
      }
    });

    console.log(`\n📊 ${menuItems.length} menu items created successfully!\n`);

    // Display vendor-wise breakdown with checkmarks
    console.log('📋 Vendor-wise Menu Items:');
    console.log(`${vendors[0].name} (${vendorItemCounts[vendors[0].name]} items) ✅`);
    console.log(`${vendors[1].name} (${vendorItemCounts[vendors[1].name]} items) ✅`);
    console.log(`${vendors[2].name} (${vendorItemCounts[vendors[2].name]} items) ✅`);
    console.log(`${vendors[3].name} (${vendorItemCounts[vendors[3].name]} items) ✅`);
    console.log(`${vendors[4].name} (${vendorItemCounts[vendors[4].name]} items) ✅`);
    console.log(`${vendors[5].name} (${vendorItemCounts[vendors[5].name]} items) ✅`);
    console.log(`${vendors[6].name} (${vendorItemCounts[vendors[6].name]} items) ✅`);
    console.log(`${vendors[7].name} (${vendorItemCounts[vendors[7].name]} items) ✅`);
    console.log(`${vendors[8].name} (${vendorItemCounts[vendors[8].name]} items) ✅`);
    console.log(`${vendors[9].name} (${vendorItemCounts[vendors[9].name]} items) ✅`);
    console.log('');

    // Create promo codes
    const promoCodes = await PromoCode.insertMany([
      {
        code: "FREESHIP3",
        type: "free_delivery",
        value: 0, 
        maxDiscount: 0,
        minOrderValue: 0,
        isActive: true,
        maxUsagePerUser: 3, 
        isFirstTimeUserOnly: false, 
      },
    ]);

    console.log(`${promoCodes.length} promo codes created`);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};
