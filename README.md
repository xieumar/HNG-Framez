
# Framez

Framez is a mobile application built with React Native and Expo. It allows users to share and view photos, interact with posts through likes and comments, and manage their profiles. The backend is powered by Convex, providing a seamless and real-time data synchronization experience.

## Features

-   **Authentication:** Secure user sign-up and sign-in functionality using Clerk.
-   **Feed:** A scrollable feed to view photos shared by other users.
-   **Create Post:** Upload and share your own photos.
-   **Profile:** View and manage your user profile.
-   **Likes and Comments:** Interact with posts by liking and commenting on them.
-   **Real-time Updates:** Convex automatically syncs data changes across users, providing a fast and consistent experience without manual refreshes.

## Tech Stack

-   **Frontend:**
    -   React Native
    -   Expo
    -   TypeScript
    -   React Navigation
    -   Clerk for authentication
-   **Backend:**
    -   Convex: A serverless backend platform designed for real-time apps. Convex simplifies data handling by integrating database, business logic, and live synchronization in one system. It eliminates the need for complex APIs and ensures instant updates to all connected clients when data changes.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js:** [Download & Install Node.js](https://nodejs.org/en/download/) (LTS version recommended)
-   **npm:** Node Package Manager, which comes with Node.js.
-   **Expo CLI:** Install globally via npm:
    ```sh
    npm install -g expo-cli
    ```
-   **Git:** [Download & Install Git](https://git-scm.com/downloads)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/xieumar/HNG-Framez.git
    cd framez
    ```
    
2.  **Install NPM packages:**
    Navigate into the cloned project directory and install the required dependencies:
    ```sh
    npm install
    ```

3.  **Set up Environment Variables (Convex and Clerk):**
    Framez uses Convex for its backend and Clerk for authentication. You'll need to set up your own Convex project and Clerk application.

    -   **Convex:**
        1.  Go to [Convex](https://www.convex.dev/) and create a new project.
        2.  Install the Convex CLI: `npm install -g convex-cli`
        3.  Log in to Convex: `npx convex login`
        4.  Deploy your Convex functions: `npx convex deploy`
        5.  Copy your `CONVEX_URL` from the Convex dashboard.
        6.  Create a `.env` file in the root of your project and add your Convex deployment URL:
            ```
            EXPO_PUBLIC_CONVEX_URL="YOUR_CONVEX_DEPLOYMENT_URL"
            ```

    -   **Clerk:**
        1.  Go to [Clerk](https://clerk.com/) and create a new application.
        2.  Obtain your `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from your Clerk dashboard.
        3.  Add these to your `.env` file:
            ```
            EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"
            CLERK_SECRET_KEY="YOUR_CLERK_SECRET_KEY"
            ```
        *Note: `CLERK_SECRET_KEY` is for server-side operations and should not be exposed in client-side code. Ensure your Convex functions handle Clerk webhooks securely.*

4.  **Start the development server:**
    Once all dependencies are installed and environment variables are set, you can start the Expo development server:
    ```sh
    npm start
    ```
    This will open a new tab in your browser with the Expo Dev Tools. You can then run the app on an iOS simulator, Android emulator, or on your physical device by scanning the QR code with the Expo Go app.


####  Development Notes

    - Use expo doctor to diagnose common issues.

    - Run npx convex dev to start the Convex local backend during development.

    - For production builds, use eas build (Expo Application Services).

##### License

This project is licensed under the MIT License