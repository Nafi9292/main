const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      class TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Results table
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      subject TEXT NOT NULL,
      marks INTEGER NOT NULL,
      total_marks INTEGER NOT NULL,
      exam_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id)
    )`);

    // Announcements table
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Admin table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Insert default admin if table is empty
        db.get('SELECT COUNT(*) as count FROM admins', (err, result) => {
          if (!err && result.count === 0) {
            db.run('INSERT INTO admins (username, password) VALUES (?, ?)', 
                   ['admin', 'admin123']);
            console.log('Default admin created: username: admin, password: admin123');
          }
        });
      }
    });
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

app.use(session({
  secret: 'ind-kj-board-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'KJ BOARD MATH POWER - Home',
    isAdmin: req.session.admin ? true : false
  });
});

// Students routes
app.get('/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY created_at DESC', (err, students) => {
    if (err) {
      console.error(err);
      students = [];
    }
    
    const success = req.query.success === '1';
    const updated = req.query.updated === '1';
    const deleted = req.query.deleted === '1';
    
    res.render('students/index', { 
      title: 'Students', 
      students,
      success: success || updated || deleted,
      updated,
      deleted,
      isAdmin: req.session.admin ? true : false
    });
  });
});

app.get('/students/new', requireAdmin, (req, res) => {
  res.render('students/new', { title: 'Add New Student' });
});

app.post('/students', requireAdmin, (req, res) => {
  const { name, roll_number, class_name, email, phone } = req.body;
  db.run(
    'INSERT INTO students (name, roll_number, class, email, phone) VALUES (?, ?, ?, ?, ?)',
    [name, roll_number, class_name, email, phone],
    function(err) {
      if (err) {
        console.error(err);
        res.redirect('/students/new?error=1');
      } else {
        res.redirect('/students?success=1');
      }
    }
  );
});

// Edit student route
app.get('/students/:id/edit', requireAdmin, (req, res) => {
  const studentId = req.params.id;
  db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, student) => {
    if (err) {
      console.error(err);
      res.redirect('/students?error=1');
    } else if (!student) {
      res.redirect('/students?error=1');
    } else {
      res.render('students/edit', { title: 'Edit Student', student });
    }
  });
});

app.post('/students/:id/edit', requireAdmin, (req, res) => {
  const studentId = req.params.id;
  const { name, roll_number, class_name, email, phone } = req.body;
  
  db.run(
    'UPDATE students SET name = ?, roll_number = ?, class = ?, email = ?, phone = ? WHERE id = ?',
    [name, roll_number, class_name, email, phone, studentId],
    function(err) {
      if (err) {
        console.error(err);
        res.redirect(`/students/${studentId}/edit?error=1`);
      } else {
        res.redirect('/students?updated=1');
      }
    }
  );
});

// Delete student route
app.post('/students/:id/delete', requireAdmin, (req, res) => {
  const studentId = req.params.id;
  
  // First check if student has any results
  db.get('SELECT COUNT(*) as count FROM results WHERE student_id = ?', [studentId], (err, result) => {
    if (err) {
      console.error(err);
      res.redirect('/students?error=1');
    } else if (result.count > 0) {
      // Student has results, delete them first
      db.run('DELETE FROM results WHERE student_id = ?', [studentId], (err) => {
        if (err) {
          console.error(err);
          res.redirect('/students?error=1');
        } else {
          // Now delete the student
          db.run('DELETE FROM students WHERE id = ?', [studentId], (err) => {
            if (err) {
              console.error(err);
              res.redirect('/students?error=1');
            } else {
              res.redirect('/students?deleted=1');
            }
          });
        }
      });
    } else {
      // No results, delete student directly
      db.run('DELETE FROM students WHERE id = ?', [studentId], (err) => {
        if (err) {
          console.error(err);
          res.redirect('/students?error=1');
        } else {
          res.redirect('/students?deleted=1');
        }
      });
    }
  });
});

// View individual student results
app.get('/students/:id/results', (req, res) => {
  const studentId = req.params.id;
  
  // Get student information
  db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, student) => {
    if (err || !student) {
      res.redirect('/students?error=1');
    } else {
      // Get student results
      db.all('SELECT * FROM results WHERE student_id = ? ORDER BY created_at DESC', [studentId], (err, results) => {
        if (err) {
          console.error(err);
          results = [];
        }
        res.render('students/view-results', { 
          title: `${student.name} - Results`, 
          student,
          results
        });
      });
    }
  });
});

// Results routes
app.get('/results', (req, res) => {
  db.all(`
    SELECT r.*, s.name as student_name, s.roll_number 
    FROM results r 
    JOIN students s ON r.student_id = s.id 
    ORDER BY r.created_at DESC
  `, (err, results) => {
    if (err) {
      console.error(err);
      results = [];
    }
    res.render('results/index', { 
      title: 'Results', 
      results,
      isAdmin: req.session.admin ? true : false
    });
  });
});

app.get('/results/new', requireAdmin, (req, res) => {
  db.all('SELECT id, name, roll_number FROM students', (err, students) => {
    if (err) {
      console.error(err);
      students = [];
    }
    res.render('results/new', { title: 'Add New Result', students });
  });
});

app.post('/results', requireAdmin, (req, res) => {
  const { student_id, subject, marks, total_marks, exam_date } = req.body;
  db.run(
    'INSERT INTO results (student_id, subject, marks, total_marks, exam_date) VALUES (?, ?, ?, ?, ?)',
    [student_id, subject, marks, total_marks, exam_date],
    function(err) {
      if (err) {
        console.error(err);
        res.redirect('/results/new?error=1');
      } else {
        res.redirect('/results?success=1');
      }
    }
  );
});

// Announcements routes
app.get('/announcements', (req, res) => {
  db.all('SELECT * FROM announcements ORDER BY created_at DESC', (err, announcements) => {
    if (err) {
      console.error(err);
      announcements = [];
    }
    res.render('announcements/index', { 
      title: 'Announcements', 
      announcements,
      isAdmin: req.session.admin ? true : false
    });
  });
});

app.get('/announcements/new', requireAdmin, (req, res) => {
  res.render('announcements/new', { title: 'Add New Announcement' });
});

app.post('/announcements', requireAdmin, (req, res) => {
  const { title, content, priority } = req.body;
  db.run(
    'INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)',
    [title, content, priority],
    function(err) {
      if (err) {
        console.error(err);
        res.redirect('/announcements/new?error=1');
      } else {
        res.redirect('/announcements?success=1');
      }
    }
  );
});

// Admin routes
app.get('/admin/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin/login', { title: 'Admin Login', error: req.query.error === '1' });
  }
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', 
         [username, password], (err, admin) => {
    if (err || !admin) {
      res.redirect('/admin/login?error=1');
    } else {
      req.session.admin = admin;
      res.redirect('/admin/dashboard');
    }
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  // Get statistics
  db.get('SELECT COUNT(*) as totalStudents FROM students', (err, studentsResult) => {
    db.get('SELECT COUNT(*) as totalResults FROM results', (err, resultsResult) => {
      db.get('SELECT COUNT(*) as totalAnnouncements FROM announcements', (err, announcementsResult) => {
        db.get('SELECT AVG(CAST(marks AS FLOAT) / CAST(total_marks AS FLOAT) * 100) as avgMarks FROM results', (err, avgResult) => {
          const stats = {
            totalStudents: studentsResult ? studentsResult.totalStudents : 0,
            totalResults: resultsResult ? resultsResult.totalResults : 0,
            totalAnnouncements: announcementsResult ? announcementsResult.totalAnnouncements : 0,
            avgMarks: avgResult && avgResult.avgMarks ? Math.round(avgResult.avgMarks) : 0
          };
          
          // Mock recent activity (you can implement real activity tracking)
          const recentActivity = [
            { icon: 'user-plus', color: 'primary', description: 'New student added', time: '2 hours ago' },
            { icon: 'chart-bar', color: 'success', description: 'Result recorded', time: '4 hours ago' },
            { icon: 'bullhorn', color: 'warning', description: 'Announcement posted', time: '1 day ago' }
          ];
          
          res.render('admin/dashboard', { 
            title: 'Admin Dashboard', 
            admin: req.session.admin,
            stats,
            recentActivity
          });
        });
      });
    });
  });
});

app.get('/admin/settings', requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as totalStudents FROM students', (err, studentsResult) => {
    db.get('SELECT COUNT(*) as totalResults FROM results', (err, resultsResult) => {
      db.get('SELECT COUNT(*) as totalAnnouncements FROM announcements', (err, announcementsResult) => {
        const stats = {
          totalStudents: studentsResult ? studentsResult.totalStudents : 0,
          totalResults: resultsResult ? resultsResult.totalResults : 0,
          totalAnnouncements: announcementsResult ? announcementsResult.totalAnnouncements : 0
        };
        
        res.render('admin/settings', { 
          title: 'Admin Settings', 
          admin: req.session.admin,
          stats,
          success: req.query.success === '1'
        });
      });
    });
  });
});

app.post('/admin/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  if (newPassword !== confirmPassword) {
    res.redirect('/admin/settings?error=1');
    return;
  }
  
  db.get('SELECT * FROM admins WHERE id = ? AND password = ?', 
         [req.session.admin.id, currentPassword], (err, admin) => {
    if (err || !admin) {
      res.redirect('/admin/settings?error=1');
    } else {
      db.run('UPDATE admins SET password = ? WHERE id = ?', 
             [newPassword, req.session.admin.id], (err) => {
        if (err) {
          res.redirect('/admin/settings?error=1');
        } else {
          res.redirect('/admin/settings?success=1');
        }
      });
    }
  });
});

// Export routes
app.get('/admin/export-students', requireAdmin, (req, res) => {
  db.all('SELECT * FROM students ORDER BY created_at DESC', (err, students) => {
    if (err) {
      res.redirect('/admin/settings?error=1');
    } else {
      const csv = 'ID,Name,Roll Number,Class,Email,Phone,Created\n' +
                  students.map(s => `${s.id},"${s.name}","${s.roll_number}","${s.class}","${s.email || ''}","${s.phone || ''}","${s.created_at}"`).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
      res.send(csv);
    }
  });
});

app.get('/admin/export-results', requireAdmin, (req, res) => {
  db.all(`
    SELECT r.*, s.name as student_name, s.roll_number 
    FROM results r 
    JOIN students s ON r.student_id = s.id 
    ORDER BY r.created_at DESC
  `, (err, results) => {
    if (err) {
      res.redirect('/admin/settings?error=1');
    } else {
      const csv = 'ID,Student Name,Roll Number,Subject,Marks,Total Marks,Exam Date,Created\n' +
                  results.map(r => `${r.id},"${r.student_name}","${r.roll_number}","${r.subject}",${r.marks},${r.total_marks},"${r.exam_date || ''}","${r.created_at}"`).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
      res.send(csv);
    }
  });
});

app.get('/admin/clear-data', requireAdmin, (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM results');
    db.run('DELETE FROM students');
    db.run('DELETE FROM announcements');
    res.redirect('/admin/settings?success=1');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 