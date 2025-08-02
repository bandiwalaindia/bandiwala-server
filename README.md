# Bandiwala Backend Server

## Setup

```bash
npm i
```

## Development Server

```bash
npm run dev
```

## Production Server

```bash
npm start
```

## 🆕 New Features

### Favorites API ⭐
Complete favorites functionality has been implemented with the following endpoints:

#### Core Operations
- `GET /api/favorites/user` - Get all user favorites
- `GET /api/favorites/vendors` - Get favorite vendors
- `GET /api/favorites/menu-items` - Get favorite menu items
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:type/:id` - Remove from favorites
- `POST /api/favorites/toggle` - Toggle favorite status

#### Utility Operations
- `GET /api/favorites/check/:type/:id` - Check if item is favorite
- `GET /api/favorites/user/count` - Get favorites count
- `GET /api/favorites/:id` - Get favorite by ID
- `POST /api/favorites/bulk` - Bulk add favorites
- `DELETE /api/favorites/user` - Clear all favorites

#### Features
- ✅ JWT Authentication required
- ✅ Pagination and search support
- ✅ Vendor and menu item favorites
- ✅ Bulk operations for import/export
- ✅ Comprehensive error handling
- ✅ Database indexes for performance

# TODOS

1. Update the config details into single file.  Be that .env
The code should reference the .env file anod nothing else  .env_production  or config.env
4.  TODO
When I load bandiwala.co.in the resource calls to /vendors is hapening 3 times (observed in Netowrks tab.)
It is not very critical because the later calls are 304 instead of 200. 
But it is good to fix it. 

5. TODO Mongo db  (not very critical)
Weekly check the quota used by MongoDB 
Once it reaches 200MB, then plan to migrate it to college Mongo with predic backups to S3 or equalent. 



