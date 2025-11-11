# LaunchDarkly Context Demo

A React application demonstrating LaunchDarkly feature flag integration with context management and real-time flag evaluation.

## Features

- **User Authentication**: Login/logout functionality with user context management
- **Feature Flag Display**: View all feature flags in the project with their current values
- **Evaluation Reasons**: See why each flag was evaluated the way it was (rule match, fallthrough, etc.)
- **Lifecycle Event Logger**: Real-time sidebar component tracking LaunchDarkly SDK lifecycle events (ready, initialized, failed, error, change)
- **Context Management**: 
  - Multi-context support (user + anonymous user)
  - Anonymous user key persistence across page reloads (sessionStorage)
  - Manual anonymous user context regeneration
- **SDK Configuration**:
  - Bootstrap from localStorage for offline support
  - Evaluation reasons enabled for detailed flag evaluation insights
  - 5-second initialization timeout

## Tech Stack

- React 18
- Vite 7.2
- LaunchDarkly React Web SDK
- Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file with your LaunchDarkly client-side ID:
     ```
     REACT_APP_LD_CLIENT_ID=your-client-side-id
     ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Usage

- **Login**: Use any username/password to log in. The username "Michal" will be assigned "gold" customer status, others get "bronze"
- **View Flags**: The "All Feature Flags" table shows all flags with their values and evaluation reasons
- **Lifecycle Events**: The collapsible sidebar on the right shows real-time SDK lifecycle events
- **Generate Anonymous Context**: Click the button to generate a new anonymous user context key
