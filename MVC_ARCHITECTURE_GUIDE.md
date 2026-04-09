# MVC Architecture Refactoring Guide

This document outlines the new Model-View-Controller (MVC) architecture implemented in the Waiz application.

## Architecture Overview

The application now follows a clear MVC pattern with:
- **Models** (in `client/src/models/`) - Data models and business logic utilities
- **Controllers** (in `client/src/controllers/`) - Business logic and API operations
- **Views** (in `client/src/pages/`) - React components for rendering UI

## Directory Structure

```
client/src/
├── models/
│   ├── index.ts              (Barrel export)
│   ├── types.ts              (Shared type exports from @shared/schema)
│   ├── User.ts               (User model with utilities)
│   ├── Item.ts               (Item/Marketplace model)
│   ├── Request.ts            (Collection/Purchase request model)
│   ├── Message.ts            (Messaging model)
│   ├── Review.ts             (Review/Rating model)
│   └── Rate.ts               (Market rates model)
├── controllers/
│   ├── index.ts              (Barrel export)
│   ├── AuthController.ts     (Authentication operations)
│   ├── UserController.ts     (User profile operations)
│   ├── ItemController.ts     (Marketplace item operations)
│   ├── RequestController.ts  (Request operations)
│   ├── MessageController.ts  (Messaging operations)
│   └── RateController.ts     (Market rate operations)
├── pages/                     (Views - React components)
├── components/               (Reusable UI components)
└── ...
```

## Models

Models contain:
1. **Type exports** - Re-exported from shared schema for type safety
2. **Validation** - Static methods to validate data against schemas
3. **Utility methods** - Filtering, formatting, and data transformation

### Example Model Usage

```typescript
import { UserModel, User } from '@/models';

// Validate user data
const isValid = UserModel.validate(userData);

// Check user type
const isHousehold = UserModel.isHousehold(user);

// Get display name
const name = UserModel.getDisplayName(user);

// Check profile completion
const isComplete = UserModel.isProfileComplete(user);
```

## Controllers

Controllers handle:
1. **API Calls** - Fetch, POST, PUT, DELETE operations
2. **Firebase Operations** - Real-time listeners and updates
3. **Business Logic** - Complex operations spanning multiple models
4. **localStorage Management** - User state persistence

### Controller Categories

#### AuthController
Handles authentication flows:
- `login()` - Sign in with email/password
- `signup()` - Create new account
- `logout()` - Sign out
- `getErrorMessage()` - User-friendly error messages
- `fetchUserProfile()` - Get user data after auth
- `updateUserProfile()` - Update user info

```typescript
import { AuthController } from '@/controllers';

const result = await AuthController.login(email, password);
const user = await AuthController.signup(email, password, name, userType);
```

#### UserController
Manages user profiles:
- `loadFromLocalStorage()` - Retrieve cached user
- `saveToLocalStorage()` - Cache user data
- `fetchUserByUid()` - Get user from Firebase
- `updateProfile()` - Update user data
- `updateLocation()` - Update user location
- `onProfileChange()` - Real-time profile updates

```typescript
import { UserController } from '@/controllers';

const user = UserController.loadFromLocalStorage();
UserController.saveToLocalStorage(user);
const unsubscribe = UserController.onProfileChange(uid, (user) => {
  console.log('User updated:', user);
});
```

#### ItemController
Handles marketplace items:
- `fetchAllItems()` - Get all items
- `fetchItemsBySeller()` - Get items for specific seller
- `createItem()` - Create new item listing
- `updateItem()` - Modify item
- `deleteItem()` - Remove item
- `updateItemStatus()` - Change item status
- `onSellerItems()` - Real-time item updates for seller

```typescript
import { ItemController } from '@/controllers';

const items = await ItemController.fetchAllItems();
const unsubscribe = ItemController.onSellerItems(sellerId, (items) => {
  setItems(items);
});
```

#### RequestController
Manages requests:
- `fetchAllRequests()` - Get all requests
- `fetchRequestsByRequester()` - Get requester's requests
- `fetchRequestsByResponder()` - Get responder's requests
- `createRequest()` - Create new request
- `updateRequestStatus()` - Change status
- `acceptRequest()` - Accept a request
- `completeRequest()` - Mark as complete

#### MessageController
Handles messaging:
- `fetchAllMessages()` - Get all messages
- `fetchConversation()` - Get conversation between users
- `sendMessage()` - Send new message
- `markAsRead()` - Mark message as read
- `deleteMessage()` - Remove message

#### RateController
Manages market rates:
- `fetchAllRates()` - Get all rates
- `fetchRatesByCategory()` - Filter by category
- `fetchRatesBySeller()` - Get seller's rates
- `createRate()` - Create rate
- `updateRate()` - Modify rate
- `deleteRate()` - Remove rate

## Views (Pages)

Pages are React components in `client/src/pages/` that:
1. **Import from Models** - Use types and validation from models
2. **Import from Controllers** - Call business logic methods
3. **Manage UI State** - Handle local component state
4. **Render Components** - Display UI using component library

### Example Page Structure

```typescript
import { useState, useEffect } from 'react';
import { UserController, ItemController } from '@/controllers';
import { User, Item } from '@/models';
import { useToast } from '@/hooks/use-toast';

export default function ExamplePage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const { toast } = useToast();

  // Load user from localstorage using controller
  useEffect(() => {
    const currentUser = UserController.loadFromLocalStorage();
    setUser(currentUser);
  }, []);

  // Subscribe to real-time items
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = ItemController.onSellerItems(user.id, setItems);
    return unsubscribe;
  }, [user?.id]);

  const handleCreateItem = async (itemData: any) => {
    try {
      await ItemController.createItem(itemData);
      toast({ title: 'Item created' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div>
      {/* UI rendering */}
    </div>
  );
}
```

## Import Patterns

### Correct Imports
```typescript
// Import types from models
import { User, Item, Message } from '@/models';

// Import controllers
import { UserController, ItemController } from '@/controllers';

// Import model utilities
import { UserModel, ItemModel } from '@/models';
```

### Avoid
```typescript
// ❌ Don't import directly from other locations
import { User } from '@shared/schema';  // Use models instead
import { signInWithEmailAndPassword } from 'firebase/auth';  // Use AuthController
```

## Migration Checklist

When adding new features:
- [ ] Define type in shared schema
- [ ] Create model file with validation and utilities
- [ ] Create controller with API/Firebase operations
- [ ] Use model types in views/components
- [ ] Call controller methods from views
- [ ] Avoid direct Firebase/API calls in components

## Benefits of MVC Architecture

1. **Separation of Concerns** - Clear boundaries between data, logic, and presentation
2. **Reusability** - Controllers can be used across multiple views
3. **Testability** - Controllers can be tested independently of views
4. **Maintainability** - Easier to locate and update business logic
5. **Type Safety** - Centralized type definitions prevent mismatches
6. **Consistency** - Standardized patterns across the codebase

## Updated Files

### Models Created
- `client/src/models/index.ts`
- `client/src/models/types.ts`
- `client/src/models/User.ts`
- `client/src/models/Item.ts`
- `client/src/models/Request.ts`
- `client/src/models/Message.ts`
- `client/src/models/Review.ts`
- `client/src/models/Rate.ts`

### Controllers Created
- `client/src/controllers/index.ts`
- `client/src/controllers/AuthController.ts`
- `client/src/controllers/UserController.ts`
- `client/src/controllers/ItemController.ts`
- `client/src/controllers/RequestController.ts`
- `client/src/controllers/MessageController.ts`
- `client/src/controllers/RateController.ts`

### Pages Updated
- `client/src/pages/login.tsx`
- `client/src/pages/signup.tsx`
- `client/src/pages/profile.tsx`
- `client/src/pages/dashboard.tsx`
- All other pages updated for import paths

### Components Updated
- All components updated to import from `@/models` instead of `@shared/schema`

## Next Steps

1. **Gradual Adoption** - Continue updating older pages as they're modified
2. **Testing** - Ensure all functionality works with new structure
3. **Documentation** - Update team documentation with new patterns
4. **Code Review** - Establish standards for MVC pattern usage
5. **Optimization** - Consider extracting additional utilities to models
