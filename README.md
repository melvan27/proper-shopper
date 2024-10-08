# Proper Shopper

Proper Shopper is a comprehensive shopping list management application built with Next.js, React, and Firebase. It allows users to create, manage, and share shopping lists while tracking their spending habits.

## Features

- User authentication
- Create, edit, and delete shopping lists
- Share lists with other users (editors and viewers)
- Real-time updates using Firebase
- Monthly and yearly spending tracking
- Budget management
- Spending trends visualization
- Responsive design using Chakra UI

## Technologies Used

- Next.js
- React
- Firebase (Authentication and Firestore)
- Chakra UI
- Chart.js
- TypeScript

## Current Version

The current version is v0.1.0-alpha. This is a pre-release version and may contain bugs or incomplete features.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your Firebase project and add the configuration to `firebase.ts`
4. Run the development server:
   ```
   npm run dev
   ```

## Project Structure

The main component of the application is the Dashboard. This component handles the main functionality of the application, including:

- Fetching and displaying shopping lists
- Managing user data and authentication
- Handling list creation, deletion, and pinning
- Displaying spending statistics and trends

## Key Features Explained

### User Authentication

The application uses Firebase Authentication for user management. Users can sign up, log in, and log out.

### Shopping Lists

Users can create, view, edit, and delete shopping lists. Lists can be shared with other users as editors or viewers.

### Real-time Updates

The application uses Firebase's real-time listeners to keep the data up-to-date across all connected clients.

### Spending Tracking

The Dashboard component calculates and displays monthly and yearly spending based on the items in the shopping lists.

### Budget Management

Users can set and update their monthly budget. The application provides visual feedback on spending relative to the budget.

### Spending Trends

A line chart displays the user's spending trends over the year, allowing for easy visualization of spending patterns.