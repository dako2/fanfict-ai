# Fan Fiction AI Website

A collaborative fan fiction platform with AI-powered story generation, built with FastAPI backend and React frontend.

## Features

### Backend (FastAPI)
- **DAG Story Structure**: Stories are organized as directed acyclic graphs where each node represents a scene/chapter
- **Voting System**: Users can like/dislike story nodes to influence popularity
- **Comment System**: Users can comment on story nodes and propose plot twists
- **AI Integration**: Gemini API integration for AI-powered plot twist generation and story continuations
- **RESTful API**: Complete API for story management, node navigation, voting, and comments

### Frontend (React + TypeScript)
- **Interactive Story Reader**: Navigate through story branches with a clean, intuitive interface
- **Story Creation**: Create new stories with initial content and metadata
- **Voting Interface**: Like/dislike story nodes with real-time vote counts
- **Comment & Plot Twist System**: Add comments and propose AI-enhanced plot twists
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components

## Architecture

### Story DAG Structure
- Each story has multiple nodes (scenes/chapters)
- Nodes can have multiple parents and children, creating branching narratives
- Users can "time-travel" to any node and explore different story paths
- Popular branches are highlighted based on voting

### AI Integration
- **Gemini API**: Powers AI story generation and plot twist enhancement
- **Context-Aware**: AI considers story context, genre, and existing narrative
- **Fallback System**: Graceful degradation when AI is unavailable

## Setup

### Backend Setup
```bash
cd backend
poetry install
poetry run fastapi dev app/main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend `.env`:**
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Stories
- `POST /api/stories` - Create new story
- `GET /api/stories` - List all stories
- `GET /api/stories/{story_id}` - Get specific story

### Story Nodes
- `GET /api/stories/{story_id}/nodes/{node_id}` - Get story node
- `POST /api/stories/{story_id}/nodes/{parent_node_id}/children` - Create child node
- `GET /api/stories/{story_id}/nodes/{node_id}/children` - Get child nodes

### Voting
- `POST /api/nodes/{node_id}/vote` - Vote on a node
- `GET /api/nodes/{node_id}/votes` - Get node votes
- `GET /api/stories/{story_id}/popular-nodes` - Get popular nodes

### Comments & AI
- `POST /api/nodes/{node_id}/comments` - Add comment
- `GET /api/nodes/{node_id}/comments` - Get comments
- `POST /api/stories/{story_id}/nodes/{node_id}/ai-twist` - Generate AI plot twist

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation and serialization
- **Google Generative AI**: Gemini API integration
- **Poetry**: Dependency management

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **React Router**: Client-side routing
- **Lucide React**: Icon library

## Development

The application uses an in-memory database for simplicity. In production, you would want to integrate with a proper database like PostgreSQL or a graph database like Neo4j for optimal DAG operations.

Both servers support hot reloading during development:
- Backend: FastAPI dev server auto-reloads on file changes
- Frontend: Vite dev server with HMR (Hot Module Replacement)

## Deployment

The backend is configured for deployment to Fly.io with proper CORS settings. The frontend can be deployed to any static hosting service after building with `npm run build`.
