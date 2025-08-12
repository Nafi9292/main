# MATH POWER Website

A comprehensive web application for managing students, results, and announcements for MATH POWER.

## Features

- **Student Management**: Add, edit, delete, and view student records
- **Results Management**: Track academic performance with grades and percentages
- **Announcements**: Post and manage important announcements
- **Admin Panel**: Secure admin dashboard with statistics and controls
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Responsive Design**: Works on all devices and screen sizes

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts** and your site will be live!

### Option 2: Railway

1. **Create Railway account** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Deploy automatically**

### Option 3: Render

1. **Create Render account** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect your repository**
4. **Set build command:** `npm install`
5. **Set start command:** `npm start`

### Option 4: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔧 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the website:**
   - URL: http://localhost:3000
   - Admin Login: username: `admin`, password: `admin123`

## 📁 Project Structure

```
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── logo.css
│   └── js/
│       └── script.js
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── login.ejs
│   │   └── settings.ejs
│   ├── students/
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   ├── edit.ejs
│   │   └── view-results.ejs
│   ├── results/
│   │   ├── index.ejs
│   │   └── new.ejs
│   ├── announcements/
│   │   ├── index.ejs
│   │   └── new.ejs
│   ├── index.ejs
│   └── layout.ejs
├── server.js
├── package.json
└── README.md
```

## 🛡️ Security Features

- **Admin Authentication**: Secure login system
- **Session Management**: Protected admin routes
- **Input Validation**: Form validation and sanitization
- **SQL Injection Protection**: Parameterized queries

## 🎨 UI Features

- **Modern Design**: Bootstrap 5 with custom styling
- **Dark/Light Mode**: Theme switching with localStorage
- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions and hover effects
- **Professional Logo**: MATH POWER branding

## 📊 Admin Features

- **Dashboard**: Statistics and quick actions
- **User Management**: Admin account management
- **Data Export**: CSV export for students and results
- **System Settings**: Password change and system info

## 🔐 Default Admin Credentials

- **Username:** admin
- **Password:** admin123

**⚠️ Important:** Change these credentials after first login!

## 🌐 Environment Variables

For production deployment, consider setting these environment variables:

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
```

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Support

For support or questions, please contact the development team. 