# MVC Architecture - Quick Reference

## 📁 New Folder Structure

```
client/src/
├── models/              ← Data types and business logic utilities
│   ├── User.ts
│   ├── Item.ts
│   ├── Request.ts
│   ├── Message.ts
│   ├── Review.ts
│   ├── Rate.ts
│   ├── types.ts
│   └── index.ts
├── controllers/         ← API calls and Firebase operations
│   ├── AuthController.ts
│   ├── UserController.ts
│   ├── ItemController.ts
│   ├── RequestController.ts
│   ├── MessageController.ts
│   ├── RateController.ts
│   └── index.ts
├── pages/               ← UI Views (React components)
└── components/          ← Reusable UI components
```

## 🚀 Usage Examples

### Importing Types
```typescript
// ✅ DO THIS
import { User, Item, Message } from '@/models';

// ❌ DON'T DO THIS
import { User } from '@shared/schema';
```

### Using Controllers
```typescript
// Authentication
import { AuthController } from '@/controllers';
await AuthController.login(email, password);
await AuthController.signup(email, password, name, userType);
await AuthController.logout();

// User Management
import { UserController } from '@/controllers';
const user = UserController.loadFromLocalStorage();
UserController.saveToLocalStorage(user);
await UserController.updateProfile(uid, data);

// Items/Marketplace
import { ItemController } from '@/controllers';
const items = await ItemController.fetchAllItems();
const unsubscribe = ItemController.onSellerItems(sellerId, callback);

// Requests
import { RequestController } from '@/controllers';
await RequestController.createRequest(data);
await RequestController.updateRequestStatus(id, status);

// Messages
import { MessageController } from '@/controllers';
await MessageController.sendMessage(data);
await MessageController.markAsRead(messageId);

// Rates
import { RateController } from '@/controllers';
const rates = await RateController.fetchAllRates();
```

### Using Models
```typescript
import { UserModel, UserController } from '@/controllers';

// Validate data
const isValid = UserModel.validate(data);

// Check user type
if (UserModel.isHousehold(user)) { ... }

// Get display name
const name = UserModel.getDisplayName(user);

// Check profile completion
if (UserModel.isProfileComplete(user)) { ... }
```

## 📝 Page Example

```typescript
import { useState, useEffect } from 'react';
import { UserController, ItemController } from '@/controllers';
import { User, Item } from '@/models';

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  // Load user
  useEffect(() => {
    const currentUser = UserController.loadFromLocalStorage();
    setUser(currentUser);
  }, []);

  // Subscribe to items
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = ItemController.onSellerItems(user.id, setItems);
    return unsubscribe;
  }, [user?.id]);

  const handleAddItem = async (itemData: any) => {
    await ItemController.createItem(itemData);
  };

  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
}
```

## ✅ Files Updated

### Models Created (8 files)
- `models/User.ts` - User profile and authentication data
- `models/Item.ts` - Marketplace items
- `models/Request.ts` - Collection/Purchase requests
- `models/Message.ts` - Messaging data
- `models/Review.ts` - Reviews and ratings
- `models/Rate.ts` - Market rates for materials
- `models/types.ts` - Centralized type exports
- `models/index.ts` - Barrel exports

### Controllers Created (7 files)
- `controllers/AuthController.ts` - Login, signup, logout
- `controllers/UserController.ts` - Profile management
- `controllers/ItemController.ts` - Marketplace operations
- `controllers/RequestController.ts` - Request management
- `controllers/MessageController.ts` - Messaging operations
- `controllers/RateController.ts` - Rate management
- `controllers/index.ts` - Barrel exports

### Pages Updated (13 files)
- `pages/login.tsx` - Now uses AuthController
- `pages/signup.tsx` - Now uses AuthController & UserController
- `pages/dashboard.tsx` - Now uses UserController & AuthController
- `pages/profile.tsx` - Now uses UserController & ItemController
- `pages/marketplace.tsx` - Now imports from models
- `pages/requests.tsx` - Now imports from models
- `pages/messages.tsx` - Now imports from models
- `pages/rates.tsx` - Now imports from models
- `pages/household-ui.tsx` - Now imports from models
- `pages/chatbot.tsx` - Now imports from models
- `pages/recycling-map.tsx` - Now imports from models
- `pages/junkshop-locator.tsx` - Now imports from models
- `pages/junkshop-ui.tsx` - Now imports from models

### Components Updated (4 files)
- `components/PersonalDashboard.tsx` - Now imports from models
- `components/TransactionAnalytics.tsx` - Now imports from models
- `components/JunkshopProfile.tsx` - Now imports from models
- `components/JunkshopsMap.tsx` - Now imports from models

## 🎯 Benefits

1. **Separation of Concerns** - Clear boundaries between data, logic, and UI
2. **Reusability** - Controllers can be used across different views
3. **Testability** - Controllers can be tested independently
4. **Maintainability** - Easier to find and fix business logic
5. **Type Safety** - Centralized type definitions
6. **Consistency** - Standardized patterns throughout the app

## 📚 Documentation

For detailed information, see: [MVC_ARCHITECTURE_GUIDE.md](./MVC_ARCHITECTURE_GUIDE.md)

## 🚦 Next Steps

1. Test all pages to ensure functionality is preserved
2. Run `npm run check` to verify type safety
3. Gradually adopt the pattern in new features
4. Update any custom pages to use the new structure
