from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import json
import os
import hashlib
import secrets
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="Fan Fiction AI Website", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

stories_db: Dict[str, Any] = {}
story_nodes_db: Dict[str, Any] = {}
comments_db: Dict[str, Any] = {}
votes_db: Dict[str, Any] = {}
users_db: Dict[str, Any] = {}
sessions_db: Dict[str, Any] = {}

security = HTTPBearer(auto_error=False)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    bio: Optional[str] = ""

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    bio: str
    profile_picture: Optional[str] = None
    created_at: datetime
    stories_count: int = 0
    comments_count: int = 0

class UserProfile(BaseModel):
    id: str
    username: str
    bio: str
    profile_picture: Optional[str] = None
    created_at: datetime
    stories_count: int = 0
    comments_count: int = 0
    recent_stories: List[Dict[str, Any]] = []
    recent_comments: List[Dict[str, Any]] = []

class StoryCreate(BaseModel):
    story_input: str

class Story(BaseModel):
    id: str
    title: str
    description: str
    genre: str
    created_at: datetime
    root_node_id: str
    author_id: Optional[str] = None
    author_name: str = "Anonymous"

class StoryNodeCreate(BaseModel):
    content: str
    parent_ids: List[str] = []
    is_ai_generated: bool = False

class StoryNode(BaseModel):
    id: str
    story_id: str
    content: str
    parent_ids: List[str]
    children_ids: List[str]
    is_ai_generated: bool
    created_at: datetime
    author: str
    likes: int = 0
    dislikes: int = 0

class CommentCreate(BaseModel):
    content: str
    author: str

class Comment(BaseModel):
    id: str
    node_id: str
    content: str
    author: str
    created_at: datetime

class PlotTwistCreate(BaseModel):
    content: str
    author: str
    twist_description: str

class VoteCreate(BaseModel):
    vote_type: str  # "like" or "dislike"
    user_id: str

class Vote(BaseModel):
    id: str
    node_id: str
    user_id: str
    vote_type: str
    created_at: datetime

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_session_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    
    token = credentials.credentials
    for session in sessions_db.values():
        if session["token"] == token and session["expires_at"] > datetime.now():
            user_id = session["user_id"]
            if user_id in users_db:
                return users_db[user_id]
    return None

@app.post("/api/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    if any(user["username"] == user_data.username for user in users_db.values()):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if any(user["email"] == user_data.email for user in users_db.values()):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "bio": user_data.bio,
        "profile_picture": None,
        "password_hash": hashed_password,
        "created_at": datetime.now()
    }
    users_db[user_id] = user
    
    stories_count = sum(1 for story in stories_db.values() if story.get("author_id") == user_id)
    comments_count = sum(1 for comment in comments_db.values() if comment.get("author_id") == user_id)
    
    return User(
        **{k: v for k, v in user.items() if k != "password_hash"},
        stories_count=stories_count,
        comments_count=comments_count
    )

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    user = None
    for u in users_db.values():
        if u["username"] == login_data.username:
            user = u
            break
    
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_session_token()
    session_id = str(uuid.uuid4())
    
    session = {
        "id": session_id,
        "user_id": user["id"],
        "token": token,
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(days=30)
    }
    sessions_db[session_id] = session
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": User(**{k: v for k, v in user.items() if k != "password_hash"})
    }

@app.post("/api/auth/logout")
async def logout_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    sessions_to_remove = []
    for session_id, session in sessions_db.items():
        if session["user_id"] == current_user["id"]:
            sessions_to_remove.append(session_id)
    
    for session_id in sessions_to_remove:
        del sessions_db[session_id]
    
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return User(**{k: v for k, v in current_user.items() if k != "password_hash"})

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    
    stories_count = sum(1 for story in stories_db.values() if story.get("author_id") == user_id)
    comments_count = sum(1 for comment in comments_db.values() if comment.get("author_id") == user_id)
    
    return User(
        **{k: v for k, v in user.items() if k != "password_hash"},
        stories_count=stories_count,
        comments_count=comments_count
    )

@app.get("/api/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    
    user_stories = []
    for story in stories_db.values():
        if story.get("author_id") == user_id:
            user_stories.append(story)
    
    user_comments = []
    for comment in comments_db.values():
        if comment.get("author_id") == user_id:
            user_comments.append(comment)
    
    recent_stories = sorted(user_stories, key=lambda x: x["created_at"], reverse=True)[:5]
    recent_comments = sorted(user_comments, key=lambda x: x["created_at"], reverse=True)[:10]
    
    return UserProfile(
        **{k: v for k, v in user.items() if k != "password_hash"},
        recent_stories=recent_stories,
        recent_comments=recent_comments
    )

@app.post("/api/stories", response_model=Story)
async def create_story(story_data: StoryCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    story_id = str(uuid.uuid4())
    root_node_id = str(uuid.uuid4())
    
    if model:
        try:
            prompt = f"""Parse the following story input and extract the title, description, genre, and main story content. Return the response in this exact JSON format:

{{
    "title": "extracted title",
    "description": "brief description of the story",
    "genre": "genre (sci-fi, fantasy, romance, mystery, adventure, horror, drama, or comedy)",
    "content": "the main story content"
}}

Story Input:
{story_data.story_input}

If any field is missing, make reasonable assumptions based on the content provided."""

            response = model.generate_content(prompt)
            try:
                import json
                parsed_data = json.loads(response.text.strip())
                title = parsed_data.get("title", "Untitled Story")
                description = parsed_data.get("description", "A fan fiction story")
                genre = parsed_data.get("genre", "fantasy")
                content = parsed_data.get("content", story_data.story_input)
            except:
                lines = story_data.story_input.split('\n')
                title = "Untitled Story"
                description = "A fan fiction story"
                genre = "fantasy"
                content = story_data.story_input
                
                for line in lines:
                    if line.lower().startswith('title:'):
                        title = line[6:].strip()
                    elif line.lower().startswith('description:'):
                        description = line[12:].strip()
                    elif line.lower().startswith('genre:'):
                        genre = line[6:].strip().lower()
        except Exception as e:
            title = "Untitled Story"
            description = "A fan fiction story"
            genre = "fantasy"
            content = story_data.story_input
    else:
        lines = story_data.story_input.split('\n')
        title = "Untitled Story"
        description = "A fan fiction story"
        genre = "fantasy"
        content = story_data.story_input
        
        for line in lines:
            if line.lower().startswith('title:'):
                title = line[6:].strip()
            elif line.lower().startswith('description:'):
                description = line[12:].strip()
            elif line.lower().startswith('genre:'):
                genre = line[6:].strip().lower()
    
    root_node = {
        "id": root_node_id,
        "story_id": story_id,
        "content": content,
        "parent_ids": [],
        "children_ids": [],
        "is_ai_generated": False,
        "created_at": datetime.now(),
        "author": "Original Author",
        "likes": 0,
        "dislikes": 0
    }
    story_nodes_db[root_node_id] = root_node
    
    author_name = "Anonymous"
    author_id = None
    if current_user:
        author_name = current_user["username"]
        author_id = current_user["id"]
        users_db[current_user["id"]]["stories_count"] += 1
    
    story = {
        "id": story_id,
        "title": title,
        "description": description,
        "genre": genre,
        "created_at": datetime.now(),
        "root_node_id": root_node_id,
        "author_id": author_id,
        "author_name": author_name
    }
    stories_db[story_id] = story
    
    root_node["author"] = author_name
    root_node["author_id"] = author_id
    
    return Story(**story)

@app.get("/api/stories", response_model=List[Story])
async def get_stories():
    return [Story(**story) for story in stories_db.values()]

@app.get("/api/stories/{story_id}", response_model=Story)
async def get_story(story_id: str):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    return Story(**stories_db[story_id])

@app.get("/api/stories/{story_id}/nodes/{node_id}", response_model=StoryNode)
async def get_story_node(story_id: str, node_id: str):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    node = story_nodes_db[node_id]
    if node["story_id"] != story_id:
        raise HTTPException(status_code=404, detail="Story node not found in this story")
    return StoryNode(**node)

@app.post("/api/stories/{story_id}/nodes", response_model=StoryNode)
async def create_story_node_dag(story_id: str, node_data: StoryNodeCreate):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    
    for parent_id in node_data.parent_ids:
        if parent_id not in story_nodes_db:
            raise HTTPException(status_code=404, detail=f"Parent node {parent_id} not found")
    
    node_id = str(uuid.uuid4())
    node = {
        "id": node_id,
        "story_id": story_id,
        "content": node_data.content,
        "parent_ids": node_data.parent_ids,
        "children_ids": [],
        "is_ai_generated": node_data.is_ai_generated,
        "created_at": datetime.now(),
        "author": "User" if not node_data.is_ai_generated else "AI",
        "likes": 0,
        "dislikes": 0
    }
    story_nodes_db[node_id] = node
    
    for parent_id in node_data.parent_ids:
        story_nodes_db[parent_id]["children_ids"].append(node_id)
    
    return StoryNode(**node)

@app.post("/api/stories/{story_id}/nodes/{parent_node_id}/children", response_model=StoryNode)
async def create_story_node(story_id: str, parent_node_id: str, node_data: StoryNodeCreate):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    if parent_node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Parent node not found")
    
    node_data_dag = StoryNodeCreate(
        content=node_data.content,
        parent_ids=[parent_node_id],
        is_ai_generated=node_data.is_ai_generated
    )
    
    return await create_story_node_dag(story_id, node_data_dag)

@app.get("/api/stories/{story_id}/nodes/{node_id}/children", response_model=List[StoryNode])
async def get_node_children(story_id: str, node_id: str):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    node = story_nodes_db[node_id]
    children = []
    for child_id in node["children_ids"]:
        if child_id in story_nodes_db:
            children.append(StoryNode(**story_nodes_db[child_id]))
    
    return children

@app.post("/api/nodes/{node_id}/comments", response_model=Comment)
async def create_comment(node_id: str, comment_data: CommentCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    author_name = comment_data.author or "Anonymous"
    author_id = None
    if current_user:
        author_name = current_user["username"]
        author_id = current_user["id"]
        users_db[current_user["id"]]["comments_count"] += 1
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "node_id": node_id,
        "content": comment_data.content,
        "author": author_name,
        "author_id": author_id,
        "created_at": datetime.now()
    }
    comments_db[comment_id] = comment
    
    return Comment(**comment)

@app.get("/api/nodes/{node_id}/comments", response_model=List[Comment])
async def get_node_comments(node_id: str):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    node_comments = []
    for comment in comments_db.values():
        if comment["node_id"] == node_id:
            node_comments.append(Comment(**comment))
    
    return sorted(node_comments, key=lambda x: x.created_at)

@app.post("/api/stories/{story_id}/nodes/{node_id}/ai-twist", response_model=StoryNode)
async def generate_ai_plot_twist(story_id: str, node_id: str, twist_data: PlotTwistCreate):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    story = stories_db[story_id]
    current_node = story_nodes_db[node_id]
    
    if model:
        try:
            prompt = f"""You are a creative writing assistant helping to continue a {story["genre"]} story titled "{story["title"]}".

Story Context: {story["description"]}

Current Scene: {current_node["content"]}

Plot Twist Request: {twist_data.twist_description}

User's Twist Content: {twist_data.content}

Please expand and enhance this plot twist while maintaining consistency with the story's tone, genre, and existing narrative. Keep the response engaging and around 200-300 words. Make it feel natural as a continuation of the current scene."""

            response = model.generate_content(prompt)
            ai_content = response.text
        except Exception as e:
            ai_content = f"Building on the previous story, here's an unexpected twist: {twist_data.twist_description}\n\n{twist_data.content}\n\nThe story takes an intriguing new direction as the characters face this unexpected development..."
    else:
        ai_content = f"AI-enhanced twist: {twist_data.twist_description}\n\n{twist_data.content}\n\nThe story continues with this compelling development..."
    
    new_node_data = StoryNodeCreate(
        content=ai_content,
        parent_ids=[node_id],
        is_ai_generated=True
    )
    
    return await create_story_node_dag(story_id, new_node_data)

@app.post("/api/nodes/{node_id}/vote", response_model=Vote)
async def vote_on_node(node_id: str, vote_data: VoteCreate):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    existing_vote = None
    for vote in votes_db.values():
        if vote["node_id"] == node_id and vote["user_id"] == vote_data.user_id:
            existing_vote = vote
            break
    
    if existing_vote:
        old_vote_type = existing_vote["vote_type"]
        existing_vote["vote_type"] = vote_data.vote_type
        existing_vote["created_at"] = datetime.now()
        
        node = story_nodes_db[node_id]
        if old_vote_type == "like":
            node["likes"] -= 1
        else:
            node["dislikes"] -= 1
            
        if vote_data.vote_type == "like":
            node["likes"] += 1
        else:
            node["dislikes"] += 1
            
        return Vote(**existing_vote)
    else:
        vote_id = str(uuid.uuid4())
        vote = {
            "id": vote_id,
            "node_id": node_id,
            "user_id": vote_data.user_id,
            "vote_type": vote_data.vote_type,
            "created_at": datetime.now()
        }
        votes_db[vote_id] = vote
        
        node = story_nodes_db[node_id]
        if vote_data.vote_type == "like":
            node["likes"] += 1
        else:
            node["dislikes"] += 1
            
        return Vote(**vote)

@app.get("/api/nodes/{node_id}/votes", response_model=List[Vote])
async def get_node_votes(node_id: str):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    node_votes = []
    for vote in votes_db.values():
        if vote["node_id"] == node_id:
            node_votes.append(Vote(**vote))
    
    return sorted(node_votes, key=lambda x: x.created_at, reverse=True)

@app.get("/api/stories/{story_id}/popular-nodes", response_model=List[StoryNode])
async def get_popular_nodes(story_id: str, limit: int = 10):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    
    story_nodes = []
    for node in story_nodes_db.values():
        if node["story_id"] == story_id:
            story_nodes.append(node)
    
    popular_nodes = sorted(story_nodes, key=lambda x: x["likes"] - x["dislikes"], reverse=True)
    
    return [StoryNode(**node) for node in popular_nodes[:limit]]

@app.get("/api/stories/{story_id}/nodes", response_model=List[StoryNode])
async def get_all_story_nodes(story_id: str):
    if story_id not in stories_db:
        raise HTTPException(status_code=404, detail="Story not found")
    
    story_nodes = []
    for node in story_nodes_db.values():
        if node["story_id"] == story_id:
            story_nodes.append(StoryNode(**node))
    
    return story_nodes

@app.get("/api/stories/{story_id}/nodes/{node_id}/parents", response_model=List[StoryNode])
async def get_node_parents(story_id: str, node_id: str):
    if node_id not in story_nodes_db:
        raise HTTPException(status_code=404, detail="Story node not found")
    
    node = story_nodes_db[node_id]
    parents = []
    for parent_id in node["parent_ids"]:
        if parent_id in story_nodes_db:
            parents.append(StoryNode(**story_nodes_db[parent_id]))
    
    return parents

@app.get("/api/users/{user_id}/stories", response_model=List[Dict[str, Any]])
async def get_user_stories(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_stories = []
    for story in stories_db.values():
        if story.get("author_id") == user_id:
            node_count = sum(1 for node in story_nodes_db.values() if node["story_id"] == story["id"])
            story_with_nodes = {**story, "nodes_count": node_count}
            user_stories.append(story_with_nodes)
    
    return sorted(user_stories, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/users/{user_id}/comments", response_model=List[Dict[str, Any]])
async def get_user_comments(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_comments = []
    for comment in comments_db.values():
        if comment.get("author_id") == user_id:
            node = story_nodes_db.get(comment["node_id"])
            if node:
                story = stories_db.get(node["story_id"])
                if story:
                    comment_with_story = {
                        **comment,
                        "story_title": story["title"],
                        "story_id": story["id"]
                    }
                    user_comments.append(comment_with_story)
    
    return sorted(user_comments, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/users/{user_id}/stories", response_model=List[Dict[str, Any]])
async def get_user_stories(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_stories = []
    for story in stories_db.values():
        if story.get("author_id") == user_id:
            node_count = sum(1 for node in story_nodes_db.values() if node["story_id"] == story["id"])
            story_with_nodes = {**story, "nodes_count": node_count}
            user_stories.append(story_with_nodes)
    
    return sorted(user_stories, key=lambda x: x["created_at"], reverse=True)

@app.get("/api/users/{user_id}/comments", response_model=List[Dict[str, Any]])
async def get_user_comments(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_comments = []
    for comment in comments_db.values():
        if comment.get("author_id") == user_id:
            node = story_nodes_db.get(comment["node_id"])
            if node:
                story = stories_db.get(node["story_id"])
                if story:
                    comment_with_story = {
                        **comment,
                        "story_title": story["title"],
                        "story_id": story["id"]
                    }
                    user_comments.append(comment_with_story)
    
    return sorted(user_comments, key=lambda x: x["created_at"], reverse=True)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
