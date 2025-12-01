import Database from 'better-sqlite3';
import path from 'path';

// 获取数据库实例
export const getDatabase = () => {
  const dbPath = path.join(process.cwd(), 'db', 'database.db');
  return new Database(dbPath);
};

// 用户相关操作
export const getUsers = () => {
  const db = getDatabase();
  const users = db.prepare('SELECT * FROM users').all();
  db.close();
  return users;
};

export const getUserById = (id: number) => {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  db.close();
  return user;
};

export const createUser = (name: string, email: string) => {
  const db = getDatabase();
  const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
  db.close();
  return result;
};

// 文章相关操作
export const getPosts = () => {
  const db = getDatabase();
  const posts = db.prepare(`
    SELECT posts.*, users.name as author_name 
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id
  `).all();
  db.close();
  return posts;
};

export const getPostById = (id: number) => {
  const db = getDatabase();
  const post = db.prepare(`
    SELECT posts.*, users.name as author_name 
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id
    WHERE posts.id = ?
  `).get(id);
  db.close();
  return post;
};

export const createPost = (title: string, content: string, authorId?: number) => {
  const db = getDatabase();
  const result = db.prepare('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)')
    .run(title, content, authorId || null);
  db.close();
  return result;
};