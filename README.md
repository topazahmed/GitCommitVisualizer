# GitHub Network Visualizer

A React application that provides a visual representation of GitHub repository networks, similar to GitHub's `/network` tab. The app features GitHub OAuth authentication and displays repository branches, commits, and forks in both desktop and mobile-friendly formats.

## Features

- 🔐 **GitHub OAuth Authentication** - Secure login with your GitHub account
- 🌳 **Repository Network Visualization** - Interactive graph view of branches and commits
- 📱 **Mobile-Friendly Design** - Responsive layout with mobile-optimized views
- 🔍 **Repository Search & Filter** - Browse and filter your repositories
- 📊 **Network Statistics** - View commit, branch, fork, and contributor counts
- 🎨 **Modern UI** - Clean, GitHub-inspired interface
- ⚡ **Real-time Data** - Fetch live data from GitHub API

## Setup Instructions

### 1. GitHub OAuth App Setup

Before running the application, you need to create a GitHub OAuth App:

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Create a new OAuth App with the following settings:
   - **Application name**: GitHub Network Visualizer (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/callback`
3. After creation, note down your **Client ID** and **Client Secret**

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your GitHub OAuth credentials:
   ```
   REACT_APP_GITHUB_CLIENT_ID=your_github_client_id_here
   REACT_APP_GITHUB_CLIENT_SECRET=your_github_client_secret_here
   ```

   ⚠️ **Security Note**: In a production environment, the client secret should be handled server-side for security reasons.

### 3. Installation and Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Authentication**: Click "Sign in with GitHub" to authenticate with your GitHub account
2. **Repository Selection**: Browse and search through your repositories
3. **Network Visualization**: Select a repository to view its network graph
4. **Responsive Views**: 
   - Desktop: Interactive D3.js network graph
   - Mobile: Toggle between graph view and list view
5. **Branch Filtering**: Filter commits by specific branches
6. **Repository Stats**: View statistics about commits, branches, forks, and contributors

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Authentication**: GitHub OAuth with @octokit/oauth-app
- **API Client**: GitHub REST API with @octokit/rest
- **Visualization**: D3.js for network graphs
- **Styling**: Styled Components
- **Routing**: React Router DOM
- **Build Tool**: Create React App

## Project Structure

```
src/
├── components/
│   ├── Auth.tsx                    # Authentication components
│   ├── MobileNetworkView.tsx       # Mobile-friendly list view
│   ├── NetworkVisualization.tsx    # D3.js network graph
│   ├── OAuthCallback.tsx           # OAuth callback handler
│   ├── RepositorySelector.tsx      # Repository browsing interface
│   └── ResponsiveNetworkView.tsx   # Responsive container
├── contexts/
│   ├── ApiContext.tsx              # GitHub API client context
│   └── AuthContext.tsx             # Authentication state context
├── services/
│   └── GitHubApiClient.ts          # GitHub API service layer
├── App.tsx                         # Main application component
└── index.tsx                       # Application entry point
```

## Features in Detail

### Network Visualization
- Interactive force-directed graph using D3.js
- Color-coded branches for easy identification
- Drag and zoom functionality
- Hover tooltips with commit details
- Parent-child relationship visualization

### Mobile Experience
- Responsive design that works on all screen sizes
- Mobile-optimized list view with commit details
- Toggle between graph and list views on mobile
- Touch-friendly interface elements

### Repository Management
- View all your repositories (public and private)
- Filter by repository type (own, forks)
- Search by name or description
- Sort by last updated date
- Repository statistics display

## Available Scripts

- `npm start` - Run the development server
- `npm test` - Run the test suite
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security Considerations

- Client secret is currently handled client-side for demo purposes
- In production, implement server-side OAuth flow
- Consider implementing rate limiting for API calls
- Use environment variables for all sensitive configuration

## Acknowledgments

- GitHub for providing the comprehensive REST API
- D3.js community for visualization capabilities
- React and TypeScript teams for the excellent developer experience